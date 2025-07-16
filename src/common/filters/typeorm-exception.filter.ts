import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { DataSource, QueryFailedError } from 'typeorm';

const messages = {
  en: {
    conflict: (ref?: string) => ref ? `Cannot delete, referenced by ${ref}` : 'Cannot delete, referenced by other data',
    ownerConflict: (app: string) => `Cannot delete, user is owner of ${app}`,
    badRequest: 'Bad request',
  },
  zh: {
    conflict: (ref?: string) => ref ? `无法删除，当前记录被 ${ref} 引用` : '无法删除，当前记录被其它数据引用',
    ownerConflict: (app: string) => `无法删除，用户在应用 ${app} 中是所有者`,
    badRequest: '请求错误',
  },
};

@Catch(QueryFailedError)
export class TypeormExceptionFilter implements ExceptionFilter {
  constructor(private dataSource: DataSource) {}

  async catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const language = (request.headers['accept-language'] as string)?.split(',')[0] ?? 'en';
    const t = messages[(language as keyof typeof messages)] ?? messages.en;

    if ((exception as any).driverError?.code === '23503') {
      const detail: string = (exception as any).driverError?.detail ?? '';
      const tableMatch = detail.match(/table \"([^\"]+)\"/);
      const keyMatch = detail.match(/\(([^)]+)\)=\(([^)]+)\)/);

      const table = tableMatch ? tableMatch[1] : undefined;
      const id = keyMatch ? keyMatch[2] : undefined;
      let cascade: { id?: string; name?: string } | undefined;

      if (table && id) {
        try {
          cascade = await this.dataSource
            .getRepository(table)
            .createQueryBuilder('c')
            .select(['c.id', 'c.name'])
            .where('c.id = :id', { id })
            .getOne();
        } catch (e) {
          cascade = { id };
        }
      }

      const refName =
        table === 'application' && cascade?.name
          ? cascade.name
          : table;

      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message:
          table === 'application' && cascade?.name
            ? t.ownerConflict(cascade.name)
            : t.conflict(refName),
        cascade,
      });
    } else {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: t.badRequest,
      });
    }
  }
}
