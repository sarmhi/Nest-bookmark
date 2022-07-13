import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';

@Injectable()
export class BookmarkService {
    constructor(private prisma: PrismaService) { }
    getBookmarks(userId: number) {
        return this.prisma.bookmark.findMany({
            where: {
                userId
            }
        })
    }

    async createBookmark(userId: number, dto: CreateBookmarkDto) {
        const bookmark = await this.prisma.bookmark.create({
            data: {
                userId,
                ...dto
            }
        })
        return bookmark;
    }

    getBookmarkById(userId: number, bookmarkId: number) {
        return this.prisma.bookmark.findFirst({
            where: {
                id: bookmarkId,
                userId,
            }
        })
    }

    async editBookmarkById(userId: number, dto: EditBookmarkDto, bookmarkId: number) {
        // get bookmark by id
        const bookmark = await this.prisma.bookmark.findFirst({
            where: {
                id: bookmarkId
            }
        })

        // check if user owns bookmark
        if (!bookmark || bookmark.userId !== userId)
            throw new ForbiddenException('Access to resource denied.')

        return this.prisma.bookmark.update({
            where: {
                id: bookmarkId
            },
            data: {
                ...dto
            }
        })

    }

    async deleteBookmarkById(userId: number, bookmarkId: number) {
        // get bookmark by id
        const bookmark = await this.prisma.bookmark.findFirst({
            where: {
                id: bookmarkId
            }
        })

        // check if user owns bookmark
        if (!bookmark || bookmark.userId !== userId)
            throw new ForbiddenException('Access to resource denied.')

        return this.prisma.bookmark.delete({
            where: {
                id: bookmarkId
            }
        })
    }
}
