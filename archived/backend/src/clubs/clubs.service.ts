import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClubsService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        return this.prisma.club.create({ data });
    }

    async findAll() {
        return this.prisma.club.findMany({
            include: {
                owner: {
                    select: { username: true, email: true }
                }
            }
        });
    }

    async findByOwner(ownerId: string) {
        return this.prisma.club.findMany({
            where: { ownerId },
            include: { rooms: true }
        });
    }

    async findOne(id: string) {
        return this.prisma.club.findUnique({
            where: { id },
            include: { rooms: { include: { computers: true } } }
        });
    }

    async update(id: string, data: any) {
        return this.prisma.club.update({
            where: { id },
            data
        });
    }

    async remove(id: string) {
        return this.prisma.club.delete({ where: { id } });
    }
}
