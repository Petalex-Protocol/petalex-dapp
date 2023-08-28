export const standardiseDecimals = (amount: string | number | undefined, decimals: string | number) => {
    if (!amount) return 0
    return Number(amount) / (10 ** Number(decimals))
}

export const convertFromDecimals = (amount: string | number | undefined, decimals: string | number) => {
    if (!amount) return 0
    return Number(amount) * (10 ** Number(decimals))
}