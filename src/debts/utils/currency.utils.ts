// from number to currency string
export const numberToCurrency = (number: number | string): string => {
  const parsedNumber = typeof number === "string" ? parseFloat(number) : number;

  if (isNaN(parsedNumber)) {
    console.error("Invalid number provided:", number);
    return "$0.00"; // Return a default value
  }

  return parsedNumber.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
};
