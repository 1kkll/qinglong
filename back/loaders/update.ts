import bodyParser from 'body-parser';
import { errors } from 'celebrate';
import cors from 'cors';
import { Application, NextFunction, Request, Response } from 'express';
import jwt from 'express-jwt';
import Container from 'typedi';
import { Logger } from 'winston';
import config from '../config';
import SystemService from '../services/system';

export default ({ app }: { app: Application }) => {
  app.set('trust proxy', 'loopback');
  app.use(cors());

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  app.use(
    jwt({
      secret: config.secret,
      algorithms: ['HS384'],
    }),
  );

  app.put(
    '/api/system',
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger');
      try {
        const systemService = Container.get(SystemService);
        const result = await systemService.reloadSystem('system');
        res.send(result);
      } catch (e) {
        logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );
  app.put(
    '/api/data',
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger');
      try {
        const systemService = Container.get(SystemService);
        const result = await systemService.reloadSystem('data');
        res.send(result);
      } catch (e) {
        logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

  app.use((req, res, next) => {
    const err: any = new Error('Not Found');
    err['status'] = 404;
    next(err);
  });

  app.use(errors());

  app.use(
    (
      err: Error & { status: number },
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      if (err.name === 'UnauthorizedError') {
        return res
          .status(err.status)
          .send({ code: 401, message: err.message })
          .end();
      }
      return next(err);
    },
  );

  app.use(
    (
      err: Error & { status: number },
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      res.status(err.status || 500);
      res.json({
        code: err.status || 500,
        message: err.message,
      });
    },
  );
};
