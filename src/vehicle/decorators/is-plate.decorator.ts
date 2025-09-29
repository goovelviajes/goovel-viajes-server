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
          // Regex: autos viejos/nuevos + motos viejas/nuevas
          const plateRegex =
            /^([A-Z]{3}\d{3}|\d{3}[A-Z]{3}|[A-Z]{2}\d{3}[A-Z]{2}|[A-Z]{1}\d{3}[A-Z]{3})$/;
          return plateRegex.test(value.toUpperCase());
        },
        defaultMessage(args: ValidationArguments) {
          return validationOptions?.message
            ? String(validationOptions.message)
            : `${args.property} must be in format "ABC123", "123ABC", "AB123CD" or "A000AAA"`;
        },
      },
    });
  };
}
