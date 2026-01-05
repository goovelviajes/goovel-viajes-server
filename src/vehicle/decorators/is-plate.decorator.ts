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

          // Formatos soportados (Argentina):
          // 1. AAA123 (Auto viejo)
          // 2. 123AAA (Moto vieja)
          // 3. AB123CD (Auto nuevo/Mercosur)
          // 4. 000AAA (Moto nueva/Mercosur - Formato A000AAA)
          const plateRegex =
            /^(?:[A-Z]{3}\d{3}|\d{3}[A-Z]{3}|[A-Z]{2}\d{3}[A-Z]{2}|[A-Z]{1}\d{3}[A-Z]{3})$/;

          // Eliminamos espacios por si el usuario ingresa "A 000 AAA"
          const cleanValue = value.replace(/\s+/g, '').toUpperCase();

          return plateRegex.test(cleanValue);
        },
        defaultMessage(args: ValidationArguments) {
          return validationOptions?.message
            ? String(validationOptions.message)
            : `${args.property} debe ser una patente válida (ej: ABC123, AB123CD o A000AAA)`;
        },
      },
    });
  };
}