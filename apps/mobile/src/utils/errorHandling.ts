import {ApiError} from "../lib/mobileApiClient";

export function parseError(error: unknown): string {
    if (error instanceof ApiError) {
        return error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return "Unexpected error. Please try again.";
}
