import { customAlphabet } from "nanoid";

const nanoid = customAlphabet('1234567890abcdef', 6)

export const generateRandomProfilename = (name: string) => {
    return `${name.toLowerCase()}-${nanoid()}`
}