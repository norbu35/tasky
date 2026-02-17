package mn.tasky.wallet.dto;

public record WalletBalance(long balance, long pendingPayout, String currency) {

}
