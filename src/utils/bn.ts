
const countDecimals = (value: number) => {
    let text = value.toString()
    // verify if number 0.000005 is represented as "5e-6"
    if (text.indexOf('e-') > -1) {
      let [_, trail] = text.split('e-');
      let deg = parseInt(trail, 10);
      return deg;
    }
    // count decimals for number in representation like "0.123456"
    if (Math.floor(value) !== value) {
      return value.toString().split(".")[1].length || 0;
    }
    return 0;
  }

export const standardiseDecimals = (amount: string | number | bigint | undefined, decimals: string | number) => {
    if (!amount) return 0
    return Number(amount) / (10 ** Number(decimals))
}

export const convertFromDecimals = (amount: string | number | undefined, decimals: string | number) => {
    if (!amount) return BigInt(0)
    const amountNumber = Number(amount)
    const decimalPlaces = countDecimals(amountNumber)
    if (decimalPlaces <= 0) {
        return BigInt(amountNumber) * (BigInt(10) ** BigInt(decimals))
    }
    return BigInt(Math.round(amountNumber * (10 ** decimalPlaces))) * (BigInt(10) ** BigInt(Number(decimals) - decimalPlaces))
}