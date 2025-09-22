import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsPlate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPlate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // Regex para ambos formatos sin espacios ni guiones
          const plateRegex = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;
          return plateRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return validationOptions?.message
            ? String(validationOptions.message)
            : `${args.property} must be in the format "ABC123" or "AA123BC"`;
        },
      },
    });
  };
}
