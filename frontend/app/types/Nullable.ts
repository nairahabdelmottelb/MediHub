export type Nullable<T> = T | null;

export type NullablePartial<T> = {
  [P in keyof T]: Nullable<T[P]>;
};
