import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsAdult(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isAdult',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: string, args: ValidationArguments) {
                    if (!value) return true; // si es opcional y no viene, pasa

                    const birthdate = new Date(value);
                    const today = new Date();

                    // Validar que no sea futura
                    if (birthdate > today) {
                        return false;
                    }

                    // Calcular edad
                    let age = today.getFullYear() - birthdate.getFullYear();
                    const monthDiff = today.getMonth() - birthdate.getMonth();
                    const dayDiff = today.getDate() - birthdate.getDate();

                    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                        age--;
                    }

                    return age >= 18;
                },
                defaultMessage(args: ValidationArguments) {
                    return 'User must be legal age (+18) and date must not be a future date';
                },
            },
        });
    };
}
