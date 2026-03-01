package mn.tasky.wallet.dto;

import jakarta.validation.constraints.Positive;

public record CreatePayoutRequest(@Positive int amount) {
}
