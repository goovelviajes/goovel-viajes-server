import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsDifferentLocation(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isDifferentLocation',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const o = args.object as any;
          return value?.name !== o.origin?.name;
        },
        defaultMessage() {
          return 'Destination must be different from origin';
        },
      },
    });
  };
}
