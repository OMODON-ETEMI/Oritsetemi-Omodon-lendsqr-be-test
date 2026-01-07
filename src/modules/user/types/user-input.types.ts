export interface createUser {
    first_name: string,
    last_name: string,
    email: string,
    phone_number: string,
    password: string
}

export interface fetchUser {
    email: string,
    password: string,
}