// a single query value (?ids=a) comes as a string, repeated ones (?ids=a&ids=b) as an array
export const toArray = ({ value }: { value: unknown }): unknown[] => (Array.isArray(value) ? (value as unknown[]) : [value]);
