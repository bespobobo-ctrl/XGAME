const inventoryService = require('../modules/panelB/inventoryService');
const sessionService = require('../modules/panelC/sessionService');
const financeService = require('../modules/panelA/financeService');
const { Club, User, Room, Computer, Session, Transaction, Broadcast, Product } = require('../shared/database');
const { Op } = require('sequelize');

class ManagerAppController {
    // ═══════════════════════════════════════
    // 📊 STATS & DATA
    // ═══════════════════════════════════════

    async getStats(req, res) {
        try {
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied: Missing Club Association." });
            const stats = await financeService.getClubStats(clubId);
            res.json(stats);
        } catch (error) {
            console.error("Stats error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    async getRooms(req, res) {
        try {
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied: Missing Club Association." });
            const rooms = await inventoryService.getRoomsWithComputers(clubId);
            res.json(rooms);
        } catch (error) {
            console.error("Inventory error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    // ═══════════════════════════════════════
    // 🕹️ PC ACTIONS
    // ═══════════════════════════════════════

    async pcAction(req, res) {
        try {
            const pcId = req.params.id;
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied: Missing Club Association." });
            const actionData = req.body;
            const result = await sessionService.executeAction(pcId, clubId, actionData);

            // Emit real-time update
            const io = req.app.get('io');
            if (io) {
                io.to(`club_${clubId}`).emit('room_update');
                io.emit('pc-status-updated', { clubId, pcId }); // Fallback
            }

            res.json(result);
        } catch (error) {
            console.error("Session Action Error:", error);
            res.status(400).json({ error: error.message });
        }
    }

    // ═══════════════════════════════════════
    // 🏠 ROOM MANAGEMENT
    // ═══════════════════════════════════════

    async addRoom(req, res) {
        try {
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied." });
            const { name, pricePerHour, computers } = req.body;

            if (!name) return res.status(400).json({ error: "Xona nomi kiritilishi shart" });

            const room = await Room.create({
                name,
                pricePerHour: parseInt(pricePerHour) || 15000,
                ClubId: clubId
            });

            // Kompyuterlarni yaratish
            const pcCount = parseInt(computers) || 0;
            if (pcCount > 0) {
                const pcs = [];
                for (let i = 1; i <= pcCount; i++) {
                    pcs.push({ name: `PC-${i}`, RoomId: room.id, ClubId: clubId, status: 'free' });
                }
                await Computer.bulkCreate(pcs);
            }

            // Real-time update
            const io = req.app.get('io');
            if (io) io.to(`club_${clubId}`).emit('room_update');

            res.json({ success: true, room });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async editRoom(req, res) {
        try {
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied." });

            const room = await Room.findOne({ where: { id: req.params.id, ClubId: clubId } });
            if (!room) return res.status(404).json({ error: "Xona topilmadi" });

            const { name, pricePerHour } = req.body;
            if (name) room.name = name;
            if (pricePerHour) room.pricePerHour = parseInt(pricePerHour);
            await room.save();

            // Real-time update
            const io = req.app.get('io');
            if (io) io.to(`club_${clubId}`).emit('room_update');

            res.json({ success: true, room });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async deleteRoom(req, res) {
        try {
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied." });

            const room = await Room.findOne({ where: { id: req.params.id, ClubId: clubId } });
            if (!room) return res.status(404).json({ error: "Xona topilmadi" });

            // Avval kompyuterlarni o'chirish
            await Computer.destroy({ where: { RoomId: room.id } });
            await room.destroy();

            // Real-time update
            const io = req.app.get('io');
            if (io) io.to(`club_${clubId}`).emit('room_update');

            res.json({ success: true, message: "Xona o'chirildi" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async lockRoom(req, res) {
        try {
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied." });

            const room = await Room.findOne({ where: { id: req.params.id, ClubId: clubId } });
            if (!room) return res.status(404).json({ error: "Xona topilmadi" });

            room.status = room.status === 'active' ? 'locked' : 'active';
            await room.save();

            // Real-time update
            const io = req.app.get('io');
            if (io) io.to(`club_${clubId}`).emit('room_update');

            res.json({ success: true, status: room.status });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // ═══════════════════════════════════════
    // 💳 TOP-UP MANAGEMENT
    // ═══════════════════════════════════════

    async getTopUpRequests(req, res) {
        try {
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied." });

            const topups = await Transaction.findAll({
                where: { ClubId: clubId, type: 'deposit', status: 'pending' },
                include: [{ model: User, attributes: ['username', 'telegramId'] }],
                order: [['createdAt', 'DESC']]
            });
            res.json(topups);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateTopUpStatus(req, res) {
        try {
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied." });

            const { action } = req.body; // 'approve' or 'reject'
            const txn = await Transaction.findOne({ where: { id: req.params.id, ClubId: clubId } });
            if (!txn) return res.status(404).json({ error: "Tranzaksiya topilmadi" });

            if (action === 'approve') {
                txn.status = 'approved';
                await txn.save();

                // Foydalanuvchi balansini oshirish
                const user = await User.findByPk(txn.UserId);
                if (user) {
                    user.balance = (user.balance || 0) + txn.amount;
                    await user.save({ hooks: false });
                }
            } else {
                txn.status = 'rejected';
                await txn.save();
            }

            res.json({ success: true, status: txn.status });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // ═══════════════════════════════════════
    // 💳 CLUB CARD SETTINGS
    // ═══════════════════════════════════════

    async updateClubCard(req, res) {
        try {
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied." });

            const club = await Club.findByPk(clubId);
            if (!club) return res.status(404).json({ error: "Klub topilmadi" });

            const { cardNumber, cardOwner } = req.body;
            if (cardNumber !== undefined) club.cardNumber = cardNumber;
            if (cardOwner !== undefined) club.cardOwner = cardOwner;
            await club.save();

            res.json({ success: true, message: "Karta ma'lumotlari yangilandi" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // ═══════════════════════════════════════
    // 👥 USER MANAGEMENT
    // ═══════════════════════════════════════

    async getUsers(req, res) {
        try {
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied." });

            const { search } = req.query;
            let where;

            if (search) {
                // Search both in current club AND global unassigned users
                where = {
                    [Op.and]: [
                        { [Op.or]: [{ ClubId: clubId }, { ClubId: null }] },
                        {
                            [Op.or]: [
                                { username: { [Op.like]: `%${search}%` } },
                                { telegramId: { [Op.like]: `%${search}%` } },
                                { firstName: { [Op.like]: `%${search}%` } }
                            ]
                        }
                    ]
                };
            } else {
                // Regular list: only this club
                where = { ClubId: clubId };
            }

            const users = await User.findAll({
                where,
                attributes: ['id', 'username', 'firstName', 'lastName', 'telegramId', 'balance', 'status', 'lastActive', 'role', 'ClubId'],
                order: [['lastActive', 'DESC']],
                limit: search ? 20 : 50
            });
            res.json(users);
        } catch (error) {
            console.error("getUsers error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    async addUserBalance(req, res) {
        try {
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied." });

            const user = await User.findOne({
                where: { id: req.params.id, [Op.or]: [{ ClubId: clubId }, { ClubId: null }] }
            });
            if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

            // Automatically link to club if unassigned
            if (user.ClubId === null) {
                user.ClubId = clubId;
                if (!user.role) user.role = 'customer';
            }

            const { amount } = req.body;
            const parsedAmount = parseInt(amount);
            if (!parsedAmount || parsedAmount <= 0) return res.status(400).json({ error: "Summa noto'g'ri" });

            user.balance = (user.balance || 0) + parsedAmount;
            await user.save({ hooks: false });

            await Transaction.create({
                amount: parsedAmount,
                type: 'deposit',
                status: 'approved',
                ClubId: clubId,
                UserId: user.id,
                description: `Manager tomonidan qo'shildi`
            });

            res.json({ success: true, newBalance: user.balance });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getUserDetails(req, res) {
        try {
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied." });

            const user = await User.findOne({
                where: { id: req.params.id, ClubId: clubId },
                attributes: ['id', 'username', 'firstName', 'lastName', 'telegramId', 'phone', 'balance', 'createdAt', 'lastActive']
            });
            if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

            // 📊 Stats: Visits with and without booking
            const [withReserve, withoutReserve] = await Promise.all([
                Session.count({ where: { UserId: user.id, status: 'completed', prepaidAmount: { [Op.gt]: 0 } } }),
                Session.count({ where: { UserId: user.id, status: 'completed', prepaidAmount: 0 } })
            ]);

            // ⚠️ Penalty History
            const penalties = await Transaction.findAll({
                where: { UserId: user.id, type: 'penalty' },
                order: [['createdAt', 'DESC']],
                limit: 10
            });

            res.json({
                user,
                stats: {
                    withReserve,
                    withoutReserve,
                    totalVisits: withReserve + withoutReserve
                },
                penalties
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async confirmPenaltyWarning(req, res) {
        try {
            const { id } = req.params;
            const session = await Session.findByPk(id);
            if (!session || session.status !== 'reserved') {
                return res.status(404).json({ error: "Bron topilmadi yoki allaqachon faollashtirilgan." });
            }

            const reservationScheduler = require('../scheduler/reservationScheduler');
            await reservationScheduler.sendFinalPenaltyWarning(session);

            res.json({ success: true, message: "Oxirgi ogohlantirish yuborildi." });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // ═══════════════════════════════════════
    // ☕ BAR & PRODUCTS
    // ═══════════════════════════════════════

    async getProducts(req, res) {
        try {
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied." });

            const products = await Product.findAll({
                where: { ClubId: clubId },
                order: [['category', 'ASC'], ['name', 'ASC']]
            });
            res.json(products);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async addProduct(req, res) {
        try {
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied." });

            const { name, price, category, stock } = req.body;
            if (!name || !price) return res.status(400).json({ error: "Nomi va narxi majburiy" });

            const product = await Product.create({
                name,
                price: parseInt(price),
                category: category || 'Boshqa',
                stock: parseInt(stock) || 0,
                ClubId: clubId
            });

            res.json({ success: true, product });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sellProduct(req, res) {
        try {
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied." });

            const { productId, quantity, type, pcId } = req.body; // type: 'direct' or 'pc'
            const qty = parseInt(quantity) || 1;

            const product = await Product.findByPk(productId);
            if (!product) return res.status(404).json({ error: "Mahsulot topilmadi" });

            const totalAmount = product.price * qty;

            if (type === 'pc') {
                if (!pcId) return res.status(400).json({ error: "PC tanlanmagan" });
                const activeSession = await Session.findOne({
                    where: { ComputerId: pcId, status: ['active', 'paused'] }
                });
                if (!activeSession) return res.status(400).json({ error: "Bu kompyuterda faol vaqt yo'q" });

                await Transaction.create({
                    amount: totalAmount,
                    type: 'bar_sale',
                    status: 'unpaid', // Will be approved when session stops
                    description: `Bar: ${product.name} (x${qty}) -> ${activeSession.id}-sessiya`,
                    ClubId: clubId,
                    SessionId: activeSession.id
                });

            } else {
                // Direct Cash
                await Transaction.create({
                    amount: totalAmount,
                    type: 'bar_sale',
                    status: 'approved',
                    description: `Bar: Naqd sotuv - ${product.name} (x${qty})`,
                    ClubId: clubId
                });
            }

            // Deduct stock if there is stock management
            if (product.stock > 0) {
                product.stock = Math.max(0, product.stock - qty);
                await product.save();
            }

            // Trigger sync
            const io = req.app.get('io');
            if (io) io.to(`club_${clubId}`).emit('room_update');

            res.json({ success: true, message: "Sotuv amalga oshdi" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getBarHistory(req, res) {
        try {
            const clubId = req.user?.ClubId;
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const sales = await Transaction.findAll({
                where: {
                    ClubId: clubId,
                    type: 'bar_sale',
                    createdAt: { [Op.gte]: startOfDay }
                },
                order: [['createdAt', 'DESC']]
            });

            res.json(sales);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getKassaHistory(req, res) {
        try {
            const clubId = req.user?.ClubId;
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const transactions = await Transaction.findAll({
                where: {
                    ClubId: clubId,
                    createdAt: { [Op.gte]: startOfDay }
                },
                include: [
                    { model: User, attributes: ['username'] },
                    { model: Session, attributes: ['startTime', 'endTime', 'totalCost', 'guestName', 'status'] }
                ],
                order: [['createdAt', 'DESC']]
            });

            res.json(transactions);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // ═══════════════════════════════════════
    // ⚙️ SETUP & BROADCAST
    // ═══════════════════════════════════════

    async setup(req, res) {
        try {
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied." });

            const club = await Club.findByPk(clubId);
            if (!club) return res.status(404).json({ error: "Klub topilmadi" });

            const { name, address } = req.body;
            if (name) club.name = name;
            if (address) club.address = address;
            await club.save();

            res.json({ success: true, club });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async broadcast(req, res) {
        try {
            const clubId = req.user?.ClubId;
            if (!clubId) return res.status(403).json({ error: "Access Denied." });

            const { message } = req.body;
            if (!message || !message.trim()) return res.status(400).json({ error: "Xabar matni bo'sh" });

            await Broadcast.create({
                message: message.trim(),
                type: 'club',
                senderRole: 'manager',
                ClubId: clubId
            });

            // Klubdagi barcha foydalanuvchilarga xabar
            const users = await User.findAll({
                where: { ClubId: clubId, telegramId: { [Op.ne]: null }, status: 'active' },
                attributes: ['telegramId'], raw: true
            });

            const tgIds = users.map(u => u.telegramId).filter(id => id && !id.startsWith('MANAGER_'));

            if (tgIds.length > 0) {
                const { broadcastMessage } = require('../utils/bot');
                broadcastMessage(tgIds, `📣 <b>KLUB XABARI</b>\n\n${message.trim()}`).catch(() => { });
            }

            res.json({ success: true, message: `Xabar ${tgIds.length} foydalanuvchiga yuborildi` });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ManagerAppController();
