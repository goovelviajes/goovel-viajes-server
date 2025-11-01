import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsValidBirthdate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidBirthdate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // 1️⃣ Verificar que exista valor
          if (!value) return false;

          // 2️⃣ Validar formato exacto YYYY-MM-DD
          const isoRe = /^\d{4}-\d{2}-\d{2}$/;
          if (!isoRe.test(value)) return false;

          // 3️⃣ Crear fecha en UTC para evitar problemas de zona horaria
          const date = new Date(value + 'T00:00:00Z');

          // 4️⃣ Validar que se haya podido crear (no sea NaN)
          if (isNaN(date.getTime())) return false;

          // 5️⃣ Verificar que la fecha no haya sido "autoajustada"
          // Ejemplo: "1700-02-31" se convierte en "1700-03-03"
          const parsed = date.toISOString().slice(0, 10); // convierte a YYYY-MM-DD
          if (parsed !== value) return false;

          // 6️⃣ Validar rango permitido
          const min = '1900-01-01';
          const today = new Date().toISOString().slice(0, 10);
          return value >= min && value <= today;
        },

        // 7️⃣ Mensaje de error por defecto
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be in YYYY-MM-DD format, be a valid date, and be between 1900-01-01 and today.`;
        },
      },
    });
  };
}
