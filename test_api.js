const axios = require('axios');
const jwt = require('jsonwebtoken');

async function run() {
    const token = jwt.sign({ id: 1, role: 'manager', ClubId: 1 }, 'GZ_SECRET_KEY_2026_XGAME_SECURE_TOKEN_PROD_V1');
    try {
        const res = await axios.post('http://localhost:3001/api/manager/rooms', {
            name: 'Test Room 2',
            pricePerHour: 12000,
            computers: 2
        }, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        });
        console.log("SUCCESS:", res.data);
    } catch (e) {
        console.error("ERROR:", e.response ? e.response.data : e.message);
    }
}
run();
