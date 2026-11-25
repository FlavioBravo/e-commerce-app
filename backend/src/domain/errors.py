from fastapi import HTTPException

ErrorDetail = dict[str, str | int]


class DomainError(HTTPException):
    def __init__(self, message: str, status_code: int = 400, details: list[ErrorDetail] | None = None) -> None:
        self.message = message
        self.details: list[ErrorDetail] = details or []
        super().__init__(status_code=status_code, detail=message)

    def to_dict(self) -> dict[str, str | list[ErrorDetail]]:
        body: dict[str, str | list[ErrorDetail]] = {"message": self.message}
        if self.details:
            body["details"] = self.details
        return body
