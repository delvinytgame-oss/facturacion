import { Log, LogLevel } from "prisma/generated/prisma/client";

import { Logger } from '@nestjs/common';
import prisma from '@/prisma/prisma.service';

interface LogOptions {
    userId?: string;
    path?: string;
    category: string;
    details?: Record<string, any>;
}

export class LoggerService {
    private prisma = prisma;
    private inLogger = new Logger()

    constructor() {
    }

    private normalizeOptions(options: any): LogOptions {
        if (!options || typeof options !== 'object') {
            return { category: 'system', details: { rawOptions: options } };
        }
        if (!('category' in options)) {
            if (options instanceof Error) {
                return { category: 'system', details: { error: { message: options.message, stack: options.stack } } };
            }
            return {
                category: 'system',
                userId: options.userId,
                path: options.path,
                details: options.details || options
            };
        }
        return options as LogOptions;
    }

    private async createLog(
        level: LogLevel,
        message: string,
        options: LogOptions
    ): Promise<Log> {
        try {
            const opt = this.normalizeOptions(options);
            const { category, userId, path, details } = opt;

            return this.prisma.log.create({
                data: {
                    level,
                    category,
                    message,
                    userId,
                    path,
                    details: details || {},
                },
            });

        } catch (error) {
            console.error('Erreur lors de l\'enregistrement du log en base de données:', error);
            this.inLogger.error('Impossible d\'enregistrer le log.');
            throw new Error('Impossible d\'enregistrer le log.');
        }
    }

    public info(message: string, options: any): Promise<Log> {
        const opts = this.normalizeOptions(options);
        this.inLogger.log(`[${opts.category}] ${message}`);
        return this.createLog('INFO', message, opts);
    }

    public warn(message: string, options: any): Promise<Log> {
        const opts = this.normalizeOptions(options);
        this.inLogger.warn(`[${opts.category}] ${message}`);
        return this.createLog('WARN', message, opts);
    }

    public error(message: string, options: any): Promise<Log> {
        const opts = this.normalizeOptions(options);
        this.inLogger.error(`[${opts.category}] ${message}`);
        const errorDetails = opts.details || {};
        if (errorDetails.stack === undefined) {
            errorDetails.stack = new Error().stack;
        }
        return this.createLog('ERROR', message, { ...opts, details: errorDetails });
    }

    public debug(message: string, options: any): Promise<Log> {
        const opts = this.normalizeOptions(options);
        if (process.env.NODE_ENV !== 'production' || process.env.FORCE_DEBUG_LOGS === 'true') {
            this.inLogger.debug(`[${opts.category}] ${message}`);
        }
        return this.createLog('DEBUG', message, opts);
    }

    public async fetchLogs(
        filters: {
            level?: LogLevel;
            category?: string;
            userId?: string;
            startDate?: Date;
            endDate?: Date;
        } = {},
        pagination: { skip: number; take: number } = { skip: 0, take: 50 }
    ): Promise<Log[]> {
        const whereClause: any = {};

        if (filters.level) whereClause.level = filters.level;
        if (filters.category) whereClause.category = filters.category;
        if (filters.userId) whereClause.userId = filters.userId;

        if (filters.startDate || filters.endDate) {
            whereClause.timestamp = {};
            if (filters.startDate) whereClause.timestamp.gte = filters.startDate; // greater than or equal
            if (filters.endDate) whereClause.timestamp.lte = filters.endDate;     // less than or equal
        }

        return this.prisma.log.findMany({
            where: whereClause,
            orderBy: {
                timestamp: 'desc',
            },
            skip: pagination.skip,
            take: pagination.take,
        });
    }
}

export const logger = new LoggerService();