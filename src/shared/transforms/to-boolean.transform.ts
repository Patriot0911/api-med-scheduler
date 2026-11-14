// query values come as strings: only `true` / `1` mean yes
export const toBoolean = ({ value }: { value: unknown }): unknown => (typeof value === 'string' ? ['true', '1'].includes(value) : value);
