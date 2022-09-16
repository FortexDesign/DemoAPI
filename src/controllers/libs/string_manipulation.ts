export const CapitalizeString = (text: string) => {
    return text
        .toLowerCase()
        .split(` `)
        .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
        .join(` `)
}

export const KeyGenerator = (permission: string, workspace?: string) => {
    return permission
        .toLowerCase()
        .replaceAll(` `, ``) + workspace?.toLowerCase().replaceAll(` `, ``)
}