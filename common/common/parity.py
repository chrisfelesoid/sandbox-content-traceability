def add_parity(body: bytes, num_parity_bits: int) -> bytes:
    """
    Fill the lower num_parity_bits bits of body with computed parity values.

    Layout (total = len(body) * 8):
    - Data bits:    positions 0 .. total - num_parity_bits - 1
    - Parity bit k: XOR of data bits where index % num_parity_bits == k
                    stored at position total - num_parity_bits + k
    """
    total_bits = len(body) * 8
    if num_parity_bits < 1:
        raise ValueError("num_parity_bits must be at least 1")
    if total_bits <= num_parity_bits:
        raise ValueError(
            f"body too short: {total_bits} bits, need more than {num_parity_bits}"
        )

    bits = []
    for byte in body:
        for shift in range(7, -1, -1):
            bits.append((byte >> shift) & 1)

    num_data_bits = total_bits - num_parity_bits
    data_bits = bits[:num_data_bits]

    parity_bits = []
    for k in range(num_parity_bits):
        p = 0
        for i in range(k, num_data_bits, num_parity_bits):
            p ^= data_bits[i]
        parity_bits.append(p)

    result_bits = data_bits + parity_bits

    result = bytearray()
    for i in range(0, total_bits, 8):
        byte = 0
        for j in range(8):
            byte = (byte << 1) | result_bits[i + j]
        result.append(byte)

    return bytes(result)


def check_parity(body: bytes, num_parity_bits: int) -> bool:
    """
    Check parity of body using the lower num_parity_bits bits as parity bits.

    Layout (total = len(body) * 8):
    - Data bits:    positions 0 .. total - num_parity_bits - 1
    - Parity bit k: XOR of data bits where index % num_parity_bits == k
                    stored at position total - num_parity_bits + k
    """
    total_bits = len(body) * 8
    if num_parity_bits < 1:
        raise ValueError("num_parity_bits must be at least 1")
    if total_bits <= num_parity_bits:
        raise ValueError(
            f"body too short: {total_bits} bits, need more than {num_parity_bits}"
        )

    bits = []
    for byte in body:
        for shift in range(7, -1, -1):
            bits.append((byte >> shift) & 1)

    num_data_bits = total_bits - num_parity_bits
    data_bits = bits[:num_data_bits]
    parity_bits = bits[num_data_bits:]

    for k in range(num_parity_bits):
        expected = 0
        for i in range(k, num_data_bits, num_parity_bits):
            expected ^= data_bits[i]
        if expected != parity_bits[k]:
            return False

    return True
