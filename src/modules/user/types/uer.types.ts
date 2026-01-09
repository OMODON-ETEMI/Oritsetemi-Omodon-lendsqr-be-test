export interface User {
    id: string,
    first_name: string,
    last_name: string,
    email: string,
    phone_number: string,
    password: string,
    created_at: Date;
    updated_at: Date;
}

export interface UserResponse {
    user: User
    token: string
}