import {
  BadRequestException,
  type ValidationError,
  ValidationPipe,
  type ValidationPipeOptions,
} from '@nestjs/common';

function formatErrors(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => {
    const constraints = Object.values(error.constraints || {});
    const children = formatErrors(error.children || []);

    return [...constraints, ...children];
  });
}

export class AppValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          message: formatErrors(errors),
        }),
      ...options,
    });
  }
}
