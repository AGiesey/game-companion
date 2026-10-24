// A form's errors by field. A field without an error is left out, so an empty object means the form is valid.
export type FieldErrors<Field extends string> = Partial<Record<Field, string>>
