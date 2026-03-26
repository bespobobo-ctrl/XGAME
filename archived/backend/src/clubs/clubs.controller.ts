import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('clubs')
export class ClubsController {
    constructor(private readonly clubsService: ClubsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    async create(@Body() createClubDto: any, @Req() req: any) {
        // If Super Admin manually creates or assign ownerId
        return this.clubsService.create(createClubDto);
    }

    @Get()
    async findAll() {
        return this.clubsService.findAll();
    }

    @Get('my')
    @UseGuards(JwtAuthGuard)
    async findMyClubs(@Req() req: any) {
        return this.clubsService.findByOwner(req.user.userId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.clubsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN, Role.CLUB_ADMIN)
    async update(@Param('id') id: string, @Body() updateClubDto: any) {
        return this.clubsService.update(id, updateClubDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    async remove(@Param('id') id: string) {
        return this.clubsService.remove(id);
    }
}
