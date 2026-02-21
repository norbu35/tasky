import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { designTokens } from "../../../packages/design-tokens/tokens";
import AuthScreen from "../src/app/(auth)/index";
import IndexScreen from "../src/app/index";
import BookingsScreen from "../src/app/(tabs)/bookings";
import TabsLayout from "../src/app/(tabs)/_layout";
import FeedScreen from "../src/app/(tabs)/index";
import ProfileScreen from "../src/app/(tabs)/profile";
import { Button, FormField, Input, Toast } from "../src/components/ui";
import { mobileTheme } from "../src/design/tokenAdapter";
import { LoginForm } from "../src/features/auth/components/LoginForm";
import { useRequestOtp, useVerifyOtp } from "../src/features/auth/hooks/useAuth";
import { useBookings } from "../src/features/bookings/hooks/useBookings";
import { useMyProfile, useSignOut, useUpdateProfile } from "../src/features/profile/hooks/useProfile";
import { useTasks } from "../src/features/tasks/hooks/useTasks";
import { createMemoryClientAnalyticsTracker, resolveClientLocale } from "../src/lib/clientAnalytics";
import {
    ApiError,
    type AuthTokens,
    type Booking,
    createMobileApiClient,
    type Message,
    type Profile,
    type PublicTask,
    type User
} from "../src/lib/mobileApiClient";
import { useAuthStore } from "../src/store/authStore";
import { parseError } from "../src/utils/errorHandling";
import { isRestricted } from "../src/utils/routeGuard";

jest.mock("expo-router", () => {
    const React = require("react");
    const {Text, View} = require("react-native");

    function RedirectMock({href}: { href: string }) {
        return <Text testID="redirect-target">{href}</Text>;
    }

    function TabsMock({children}: { children?: React.ReactNode }) {
        return <View testID="tabs-layout">{children}</View>;
    }

    function TabsScreenMock({
                                name,
                                options
                            }: {
        name: string;
        options?: { title?: string };
    }) {
        return <Text testID={`tab-${name}`}>{options?.title ?? name}</Text>;
    }

    TabsMock.Screen = TabsScreenMock;

    function StackMock({children}: { children?: React.ReactNode }) {
        return <View testID="stack-layout">{children}</View>;
    }

    function StackScreenMock({name}: { name: string }) {
        return <Text testID={`stack-${name}`}>{name}</Text>;
    }

    StackMock.Screen = StackScreenMock;

    return {
        Redirect: RedirectMock,
        Stack: StackMock,
        Tabs: TabsMock,
        router: {
            replace: jest.fn()
        }
    };
});

jest.mock("../src/features/auth/hooks/useAuth", () => ({
    useRequestOtp: jest.fn(),
    useVerifyOtp: jest.fn()
}));

jest.mock("../src/features/tasks/hooks/useTasks", () => ({
    useTasks: jest.fn()
}));

jest.mock("../src/features/bookings/hooks/useBookings", () => ({
    useBookings: jest.fn()
}));

jest.mock("../src/features/profile/hooks/useProfile", () => ({
    useMyProfile: jest.fn(),
    useUpdateProfile: jest.fn(),
    useSignOut: jest.fn()
}));

const mockUseRequestOtp = useRequestOtp as jest.MockedFunction<typeof useRequestOtp>;
const mockUseVerifyOtp = useVerifyOtp as jest.MockedFunction<typeof useVerifyOtp>;
const mockUseTasks = useTasks as jest.MockedFunction<typeof useTasks>;
const mockUseBookings = useBookings as jest.MockedFunction<typeof useBookings>;
const mockUseMyProfile = useMyProfile as jest.MockedFunction<typeof useMyProfile>;
const mockUseUpdateProfile = useUpdateProfile as jest.MockedFunction<typeof useUpdateProfile>;
const mockUseSignOut = useSignOut as jest.MockedFunction<typeof useSignOut>;

const baseUser: User = {
    id: "user-1",
    phone: "+97699001122",
    role: "CUSTOMER",
    status: "PENDING",
    created_at: "2026-02-14T00:00:00Z"
};

const baseSession: AuthTokens = {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    user: baseUser
};

const baseProfile: Profile = {
    id: "user-1",
    phone: "+97699001122",
    role: "CUSTOMER",
    status: "PENDING",
    full_name: "Test Customer",
    avatar_url: null,
    rating_avg: 0,
    completed_tasks: 0,
    is_pro: false,
    created_at: "2026-02-14T00:00:00Z"
};

const baseTask: PublicTask = {
    id: "public-task-1",
    category: {
        id: "cat-cleaning",
        name: "Cleaning",
        name_mn: "Цэвэрлэгээ",
        icon_url: "https://example/icon.png",
        is_active: true,
        sort_order: 1
    },
    customer: {
        id: "customer-1",
        full_name: "Customer",
        avatar_url: null,
        rating_avg: 4.7
    },
    description: "Window cleaning",
    budget: 70000,
    approximate_location: "Сүхбаатар дүүрэг",
    approximate_lat: 47.92,
    approximate_lng: 106.92,
    status: "OPEN",
    scheduled_at: "2026-02-16T00:00:00Z",
    photo_urls: [],
    application_count: 1,
    created_at: "2026-02-14T00:00:00Z"
};

const baseBooking: Booking = {
    id: "booking-1",
    task_id: "task-123456789",
    tasker_id: "tasker-1",
    customer_id: "customer-1",
    price: 120000,
    status: "ASSIGNED",
    cancellation_fee: null,
    created_at: "2026-02-14T00:00:00Z"
};

function resetAuthStore(): void {
    useAuthStore.setState({
        session: null,
        profile: null,
        deviceToken: null
    });
}

function installDefaultHookMocks(): void {
    mockUseRequestOtp.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
        error: null
    } as unknown as ReturnType<typeof useRequestOtp>);

    mockUseVerifyOtp.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
        error: null
    } as unknown as ReturnType<typeof useVerifyOtp>);

    mockUseTasks.mockReturnValue({
        data: {
            data: [],
            cursor: {next: null, prev: null}
        },
        isLoading: false
    } as unknown as ReturnType<typeof useTasks>);

    mockUseBookings.mockReturnValue({
        data: {
            data: [],
            cursor: {next: null, prev: null}
        },
        isLoading: false
    } as unknown as ReturnType<typeof useBookings>);

    mockUseMyProfile.mockReturnValue({
        data: baseProfile,
        isLoading: false
    } as unknown as ReturnType<typeof useMyProfile>);

    mockUseUpdateProfile.mockReturnValue({
        mutate: jest.fn(),
        isPending: false
    } as unknown as ReturnType<typeof useUpdateProfile>);

    mockUseSignOut.mockReturnValue(jest.fn());
}

beforeEach(() => {
    jest.clearAllMocks();
    resetAuthStore();
    installDefaultHookMocks();
});

describe("mobile app structure", () => {
    it("TID-TASK-000-MOBILE-UNIT renders auth-first shell and core error utility", () => {
        const guestRender = render(<IndexScreen/>);
        expect(screen.getByTestId("redirect-target")).toHaveTextContent("/(auth)");
        guestRender.unmount();

        useAuthStore.setState({session: baseSession});
        render(<IndexScreen/>);
        expect(screen.getByTestId("redirect-target")).toHaveTextContent("/(tabs)");

        render(<AuthScreen/>);
        expect(screen.getByText("Welcome to Tasky")).toBeTruthy();
        expect(parseError(new ApiError(401, "OTP invalid"))).toBe("OTP invalid");
        expect(parseError(new Error("generic"))).toBe("generic");
    });

    it("TID-TASK-071-MOBILE-TOKEN-ADAPTER consumes shared design tokens via adapter", () => {
        expect(mobileTheme.colors.background).toBe(designTokens.colors.background.hex);
        expect(mobileTheme.colors.primary).toBe(designTokens.colors.primary.hex);
        expect(mobileTheme.typography.body).toBe(designTokens.typography.body);
    });

    it("TID-TASK-071-MOBILE-COMPONENT-PARITY-BASE renders core primitive states", () => {
        render(
            <FormField label="Phone Number" helperText="Use Mongolian format">
                <Input placeholder="+976..." value="+97699112233" onChangeText={jest.fn()}/>
            </FormField>
        );
        expect(screen.getByText("Phone Number")).toBeTruthy();
        expect(screen.getByPlaceholderText("+976...")).toBeTruthy();

        render(<Button label="Continue" isLoading/>);
        expect(screen.queryByText("Continue")).toBeFalsy();

        render(<Toast message="Saved" variant="success"/>);
        expect(screen.getByText("Saved")).toBeTruthy();
    });

    it("TID-TASK-071-MOBILE-STATE-SEMANTIC-PARITY enforces parity matrix documentation linkage", () => {
        const parityMatrixPath = resolve(__dirname, "../../../docs/UI_PARITY_MATRIX.md");
        const matrix = readFileSync(parityMatrixPath, "utf8");

        expect(matrix).toContain("apps/mobile/src/components/ui");
        expect(matrix).toContain("Button.tsx");
        expect(matrix).toContain("Input.tsx");
        expect(matrix).toContain("FormField.tsx");
        expect(matrix).toContain("Toast.tsx");
        expect(matrix).toContain("TID-TASK-071-MOBILE-*");
    });

    it("TID-TASK-082-MOBILE-AUTH-OTP-FLOW supports OTP request and verification sequence", () => {
        const requestMutate = jest.fn((phone: string, options?: { onSuccess?: () => void }) => {
            expect(phone).toBe("+97699112233");
            options?.onSuccess?.();
        });
        const verifyMutate = jest.fn();

        mockUseRequestOtp.mockReturnValue({
            mutate: requestMutate,
            isPending: false,
            error: null
        } as unknown as ReturnType<typeof useRequestOtp>);

        mockUseVerifyOtp.mockReturnValue({
            mutate: verifyMutate,
            isPending: false,
            error: null
        } as unknown as ReturnType<typeof useVerifyOtp>);

        render(<LoginForm/>);

        fireEvent.changeText(screen.getByPlaceholderText("+976..."), "+97699112233");
        fireEvent.press(screen.getByText("Continue"));

        expect(requestMutate).toHaveBeenCalledTimes(1);
        expect(screen.getByPlaceholderText("123456")).toBeTruthy();

        fireEvent.changeText(screen.getByPlaceholderText("123456"), "123456");
        fireEvent.press(screen.getByText("Verify & Login"));

        expect(verifyMutate).toHaveBeenCalledWith({
            phone: "+97699112233",
            code: "123456"
        });
    });

    it("TID-TASK-082-MOBILE-TASK-APPLICATION-FLOW renders discoverable task feed cards", () => {
        mockUseTasks.mockReturnValue({
            data: {
                data: [baseTask],
                cursor: {next: null, prev: null}
            },
            isLoading: false
        } as unknown as ReturnType<typeof useTasks>);

        render(<FeedScreen/>);

        expect(screen.getByText("Window cleaning")).toBeTruthy();
        expect(screen.getByText("70000 MNT")).toBeTruthy();
        expect(screen.getByText("Сүхбаатар дүүрэг")).toBeTruthy();
    });

    it("TID-TASK-082-MOBILE-AUTHZ-GUARDS enforces auth routing and restricted-account checks", () => {
        const guestRender = render(<TabsLayout/>);
        expect(screen.getByTestId("redirect-target")).toHaveTextContent("/(auth)");
        guestRender.unmount();

        useAuthStore.setState({
            session: baseSession,
            profile: baseProfile
        });

        render(<TabsLayout/>);
        expect(screen.getByTestId("tabs-layout")).toBeTruthy();
        expect(screen.getByText("Explore")).toBeTruthy();
        expect(screen.getByText("Bookings")).toBeTruthy();
        expect(screen.getByText("Profile")).toBeTruthy();

        expect(isRestricted({...baseProfile, status: "BANNED"})).toBe(true);
        expect(isRestricted({...baseProfile, status: "SUSPENDED"})).toBe(true);
        expect(isRestricted(baseProfile)).toBe(false);
    });

    it("TID-TASK-083-MOBILE-BOOKING-PAYMENT-FLOW renders assigned bookings for safety actions", () => {
        mockUseBookings.mockReturnValue({
            data: {
                data: [baseBooking],
                cursor: {next: null, prev: null}
            },
            isLoading: false
        } as unknown as ReturnType<typeof useBookings>);

        render(<BookingsScreen/>);

        expect(screen.getByText("ASSIGNED")).toBeTruthy();
        expect(screen.getByText("Task ID: task-123...")).toBeTruthy();
    });

    it("TID-TASK-083-MOBILE-BOOKING-SAFETY-FLOW supports profile save and explicit sign-out actions", async () => {
        const updateMutate = jest.fn();
        const signOut = jest.fn();

        mockUseMyProfile.mockReturnValue({
            data: baseProfile,
            isLoading: false
        } as unknown as ReturnType<typeof useMyProfile>);

        mockUseUpdateProfile.mockReturnValue({
            mutate: updateMutate,
            isPending: false
        } as unknown as ReturnType<typeof useUpdateProfile>);

        mockUseSignOut.mockReturnValue(signOut);

        render(<ProfileScreen/>);

        await waitFor(() => {
            expect(screen.getByDisplayValue("Test Customer")).toBeTruthy();
        });

        fireEvent.changeText(screen.getByDisplayValue("Test Customer"), "Updated Customer");
        fireEvent.press(screen.getByText("Save Changes"));
        expect(updateMutate).toHaveBeenCalledWith({full_name: "Updated Customer"});

        fireEvent.press(screen.getByText("Sign Out"));
        expect(signOut).toHaveBeenCalledTimes(1);
    });

    it("TID-TASK-083-MOBILE-MSG-NOTIF-INTEGRATION supports notification and message API interactions", async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({message: "Device registered."})
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () =>
                    ({
                        id: "message-1",
                        conversation_id: "conversation-1",
                        sender_id: "user-1",
                        content: "Сайн байна уу",
                        created_at: "2026-02-14T00:00:00Z"
                    }) satisfies Message
            })
            .mockResolvedValueOnce({
                ok: true
            });

        Object.defineProperty(globalThis, "fetch", {
            configurable: true,
            writable: true,
            value: fetchMock
        });

        const client = createMobileApiClient("http://localhost:8080");

        await client.registerDevice("access-token", {
            token: "device-token",
            platform: "ANDROID"
        });

        const message = await client.sendMessage(
            "access-token",
            "conversation-1",
            "Сайн байна уу"
        );

        await client.unregisterDevice("access-token", "device-token");

        expect(message.content).toBe("Сайн байна уу");
        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/api/v1/notifications/devices");
        expect(fetchMock.mock.calls[1][0]).toBe(
            "http://localhost:8080/api/v1/conversations/conversation-1/messages"
        );
        expect(fetchMock.mock.calls[2][0]).toBe(
            "http://localhost:8080/api/v1/notifications/devices/device-token"
        );
    });

    it("TID-TASK-090-OBS-CLIENT-EVENTS emits analytics payloads with mobile platform and locale", () => {
        const tracker = createMemoryClientAnalyticsTracker();

        tracker.track({
            event_name: "TASK_POSTED",
            platform: "MOBILE",
            locale: resolveClientLocale(),
            actor_role: "CUSTOMER",
            task_id: "task-1",
            timestamp: "2026-02-14T00:00:00Z"
        });

        const [event] = tracker.getEvents();
        expect(event).toMatchObject({
            event_name: "TASK_POSTED",
            platform: "MOBILE",
            locale: "mn-MN",
            actor_role: "CUSTOMER",
            task_id: "task-1"
        });

        expect(resolveClientLocale()).toBe("mn-MN");
        expect(resolveClientLocale("en-US")).toBe("en-US");
    });
});
