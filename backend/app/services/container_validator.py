import re
from typing import Tuple

# ISO 6346 Character to Numeric Value mapping (multiples of 11 are omitted)
ISO_6346_LETTER_MAP = {
    'A': 10, 'B': 12, 'C': 13, 'D': 14, 'E': 15, 'F': 16, 'G': 17, 'H': 18, 'I': 19, 'J': 20,
    'K': 21, 'L': 23, 'M': 24, 'N': 25, 'O': 26, 'P': 27, 'Q': 28, 'R': 29, 'S': 30, 'T': 31,
    'U': 32, 'V': 34, 'W': 35, 'X': 36, 'Y': 37, 'Z': 38
}


def calculate_iso6346_check_digit(container_prefix_and_serial: str) -> int:
    """
    Calculates the 7th digit (check digit) for a 10-character container code (4 letters + 6 digits).
    Example: 'MSCU614298' -> returns check digit.
    """
    clean_code = container_prefix_and_serial.strip().upper().replace(" ", "").replace("-", "")
    if len(clean_code) < 10:
        return -1
    
    code_10 = clean_code[:10]
    total_sum = 0
    
    for i, char in enumerate(code_10):
        if char.isalpha():
            val = ISO_6346_LETTER_MAP.get(char, 0)
        elif char.isdigit():
            val = int(char)
        else:
            return -1
        
        weight = 2 ** i
        total_sum += val * weight
    
    remainder = total_sum % 11
    return remainder % 10  # If remainder is 10, check digit is 0


def validate_container_number(container_number: str) -> Tuple[bool, str]:
    """
    Validates container number format (4 letters + 7 digits) and ISO 6346 check digit.
    Returns (is_valid, reason).
    """
    clean = container_number.strip().upper().replace(" ", "").replace("-", "")
    pattern = r"^[A-Z]{4}\d{7}$"
    
    if not re.match(pattern, clean):
        return False, f"Invalid format '{clean}'. Must be 4 letters followed by 7 digits (e.g. MSCU1234567)."
    
    prefix_and_serial = clean[:10]
    declared_check_digit = int(clean[10])
    calculated_check_digit = calculate_iso6346_check_digit(prefix_and_serial)
    
    if calculated_check_digit != declared_check_digit:
        return False, (
            f"ISO 6346 Check-digit mismatch for {clean}: "
            f"declared '{declared_check_digit}', computed '{calculated_check_digit}'. "
            "Container will fail customs EDI gate verification."
        )
    
    return True, "Valid ISO 6346 container number."
