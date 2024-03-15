/**
 * https://www.ibm.com/docs/en/cics-ts/5.5?topic=definition-time-zone-codes
 */
export function isIBMCompatibleTimeZone(timezoneCode: string): boolean {
    const validTimezoneCodes = [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 
        'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 
        'W', 'X', 'Y', 'Z'
    ];

    return validTimezoneCodes.includes(timezoneCode);
}