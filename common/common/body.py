def parse_body(body: str, body_type: str) -> bytes:
    if body_type == "hex":
        try:
            return bytes.fromhex(body)
        except ValueError as e:
            raise ValueError(f"invalid hex string: {e}")
    elif body_type == "text":
        return body.encode("utf-8")
    elif body_type == "bit":
        if not all(c in "01" for c in body):
            raise ValueError("bit body must contain only '0' and '1'")
        if len(body) % 8 != 0:
            raise ValueError(
                f"bit body length must be a multiple of 8, got {len(body)}"
            )
        return bytes(int(body[i * 8 : (i + 1) * 8], 2) for i in range(len(body) // 8))
    else:
        raise ValueError(f"unknown body type: {body_type}")
