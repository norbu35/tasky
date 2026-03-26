const fs = require('fs');
const path = require('path');

const enPath = path.resolve(__dirname, '../apps/web/src/locales/en/translation.json');
const mnPath = path.resolve(__dirname, '../apps/web/src/locales/mn/translation.json');

const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const mnJson = JSON.parse(fs.readFileSync(mnPath, 'utf8'));

const newEnKeys = {
  "customerPages": {
    "applicants": {
      "title": "Task applicants",
      "description": "Review and connect with taskers who want to take your job.",
      "loading": "Loading applicants...",
      "noApplicants": "No applicants yet",
      "noApplicantsDesc": "Wait for taskers to apply, or boost your visibility."
    },
    "bookingConfirmed": {
      "title": "Booking confirmed",
      "description": "The tasker has been booked and the customer flow can continue to timeline or safety.",
      "backToBookings": "Back to bookings",
      "summaryTitle": "Confirmation summary",
      "summaryDesc": "The booking confirmation surface stays available for Phase 1 direct settlement."
    },
    "bookingDetail": {
      "title": "Booking detail",
      "description": "Review the booking status, message the tasker, or continue to safety actions.",
      "openSafety": "Open booking safety",
      "nextStep": "Next step",
      "messageTasker": "Message tasker",
      "statusLabel": "Status:",
      "taskerLabel": "Tasker:",
      "loadingTitle": "Loading booking detail",
      "loadingDesc": "Loading booking information."
    },
    "bookings": {
      "title": "Bookings",
      "description": "Track active, completed, and cancelled bookings in one place."
    },
    "disputeRaise": {
      "title": "Raise dispute",
      "description": "Open a dispute while keeping Phase 1 settlement rules intact.",
      "submitAction": "Submit dispute",
      "cardTitle": "Raise a dispute",
      "cardDesc": "Capture the reason, evidence, and resolution request before escalation."
    },
    "disputeStatus": {
      "title": "Dispute status",
      "description": "Review the current dispute state and the next support action.",
      "contactSupport": "Contact support",
      "cardTitle": "Resolution status",
      "cardDesc": "The customer can see whether the dispute is open, under review, or resolved."
    },
    "noApplicantRescue": {
      "title": "No applicants yet",
      "description": "Keep the task visible and help the customer recover when nobody has applied.",
      "boostVisibility": "Boost visibility",
      "recoveryTitle": "Recovery options",
      "recoveryDesc": "Prompt the customer to adjust price, timing, or description.",
      "rescueTitle": "Rescue options",
      "rescueDesc": "Keep the task in the queue and suggest a cheaper or more flexible rebook path."
    },
    "noShowReminder": {
      "title": "No-show reminder",
      "description": "Remind the tasker that the booking is still active and the customer is waiting.",
      "close": "Close"
    },
    "rebook": {
      "title": "Rebook task",
      "description": "Start a new booking from the prior task details without breaking direct settlement.",
      "continueAction": "Continue rebook",
      "cardTitle": "Rebook summary",
      "cardDesc": "Reuse the same customer details while letting the user choose a fresh schedule."
    },
    "reschedule": {
      "title": "Reschedule booking",
      "description": "Update the booking time while preserving the Phase 1 direct settlement flow.",
      "saveChanges": "Save changes",
      "cardTitle": "Choose a new time",
      "cardDesc": "Keep the booking on the customer timeline until the new time is confirmed."
    },
    "taskCancel": {
      "title": "Cancel task?",
      "description": "Stopping this task will remove it from the active customer flow.",
      "keepTask": "Keep task",
      "cancelTask": "Cancel task"
    },
    "taskSuccess": {
      "title": "Task posted successfully",
      "description": "Your task is live and ready for taskers to review.",
      "stepLabel": "Customer posting complete",
      "backToTasks": "Back to tasks",
      "postAnother": "Post another task",
      "liveTitle": "Task live",
      "liveDesc": "Taskers can now browse, review, and apply."
    },
    "taskWizard": {
      "title": "Post a new task",
      "description": "Describe what you need, where, and your budget.",
      "cancelPosting": "Cancel posting",
      "progressTitle": "Posting progress",
      "stepCategory": "Category",
      "stepDetails": "Details",
      "stepLocation": "Location",
      "stepReview": "Review",
      "nextStep": "Next step",
      "back": "Back",
      "confirmPost": "Confirm & Post",
      "categoryTitle": "What needs to be done?",
      "categoryDesc": "Select a category to get matched faster.",
      "detailsTitle": "Task details",
      "detailsDesc": "Provide specific details to help taskers understand.",
      "descLabel": "Description",
      "descPlaceholder": "Explain what you need done in detail...",
      "descRequired": "Description is required (minimum 10 characters).",
      "scheduleLabel": "When do you need this?",
      "budgetLabel": "Estimated budget (MNT)",
      "budgetInfo": "This is an estimate. Final price is agreed with the tasker.",
      "invalidBudget": "Please enter a valid budget relative to the minimum category price.",
      "photosTitle": "Task Photos",
      "photosHelp": "Help taskers understand the work."
    },
    "taskerProfile": {
      "title": "Tasker profile",
      "description": "Review the tasker before you confirm or message them.",
      "openProfile": "Open profile",
      "primaryActions": "Primary actions",
      "messageTasker": "Message tasker",
      "openChat": "Open chat",
      "verifiedTasker": "Verified Tasker",
      "trustedLabel": "Trusted for Phase 1 customer bookings and direct settlement flows.",
      "ratingStats": "{{rating}} rating from {{count}} jobs",
      "responseDetail": "Responds quickly during business hours"
    },
    "tasksList": {
      "title": "My tasks",
      "description": "Track what you have posted and jump back into the posting flow.",
      "postNew": "Post new task",
      "freshRequestTitle": "Need a fresh request?",
      "freshRequestDesc": "Start a new customer task from the same posting flow.",
      "startPosting": "Start posting",
      "loadingError": "Failed to load tasks",
      "tryAgain": "Please try again.",
      "noTasks": "No tasks yet",
      "noTasksDesc": "Post your first task to start collecting applications.",
      "customerTask": "Customer task",
      "viewDetails": "View details"
    },
    "timeline": {
      "title": "Booking timeline",
      "description": "Follow the booking from confirmation to completion and disputes.",
      "backToBooking": "Back to booking",
      "cardTitle": "Timeline",
      "confirmedLabel": "Booking confirmed",
      "confirmedDesc": "Customer accepted the tasker",
      "inProgressLabel": "Task in progress",
      "inProgressDesc": "Tasker is on the way",
      "awaitingLabel": "Awaiting completion",
      "awaitingDesc": "Capture final review or raise a dispute"
    }
  },
  "sharedPages": {
    "appUpdate": {
      "title": "Update required",
      "description": "A new version of the app is available. Please update to continue.",
      "updateNow": "Update now",
      "cardTitle": "Required changes",
      "cardDesc": "This maintains backward compatibility and enforces API version checks."
    },
    "banned": {
      "title": "Account banned",
      "description": "This account can no longer access the marketplace."
    },
    "chatDetail": {
      "title": "Conversation",
      "description": "Direct chat bounded to an active task booking.",
      "sendMessage": "Send message",
      "messageHistory": "Message history",
      "historyDesc": "Chat UI handles simple text exchanges during Phase 0."
    },
    "deleteAccount": {
      "title": "Delete account",
      "description": "Permanently remove your account and data.",
      "confirmDelete": "Confirm deletion",
      "cardTitle": "Account erasure",
      "cardDesc": "This action cannot be undone. All active tasks will be canceled."
    },
    "editProfile": {
      "title": "Edit profile",
      "description": "Update your public display information.",
      "saveChanges": "Save changes",
      "firstName": "First name",
      "lastName": "Last name",
      "bio": "Bio",
      "successTitle": "Profile updated",
      "successDesc": "Your changes have been saved successfully."
    },
    "help": {
      "title": "Help center",
      "description": "Find answers or contact our support team.",
      "cardTitle": "Common questions",
      "cardDesc": "FAQ integration limits manual support overhead early on."
    },
    "inbox": {
      "title": "Inbox",
      "description": "Recent messages from taskers and customers.",
      "cardTitle": "Messages list",
      "cardDesc": "Aggregated view of active booking chats."
    },
    "networkError": {
      "title": "Connectivity issues",
      "description": "Unable to reach the Tasky services.",
      "retry": "Retry connection",
      "cardTitle": "Offline state",
      "cardDesc": "Check your internet connection and try again."
    },
    "notifications": {
      "title": "Notifications",
      "description": "Recent alerts and updates.",
      "cardTitle": "Activity feed",
      "cardDesc": "Lists booking updates, payments, and system alerts."
    },
    "privacy": {
      "title": "Privacy policy",
      "description": "How we collect, use, and protect your information.",
      "cardTitle": "Data handling",
      "cardDesc": "Standard privacy terms covering PII and booking history."
    },
    "reviewHardLock": {
      "title": "Review prior booking",
      "description": "You must review your last completed task before continuing.",
      "submitReview": "Submit review",
      "cardTitle": "Feedback required",
      "cardDesc": "Forces quality signal capture to build market trust."
    },
    "review": {
      "title": "Leave a review",
      "description": "Capture a quick quality signal before the journey closes.",
      "submitReview": "Submit review",
      "reviewNotes": "Review notes",
      "stars": "{{count}} stars",
      "thanksTitle": "Thanks for submitting feedback.",
      "thanksDesc": "Rating recorded.",
      "thanksDescRated": "Rating recorded: {{rating}}/5."
    },
    "reviewReminder": {
      "title": "Don't forget to review",
      "description": "Please take a moment to rate your recent experience.",
      "close": "Close"
    },
    "sessionExpired": {
      "title": "Session expired",
      "description": "Please log in again to continue using the app."
    },
    "settings": {
      "title": "Settings",
      "description": "Manage notifications, language, and preferences.",
      "cardTitle": "App preferences",
      "cardDesc": "Push toggles and localized language selection."
    },
    "suspended": {
      "title": "Account suspended",
      "description": "Temporary hold placed on this account.",
      "cardTitle": "Review active",
      "cardDesc": "Contact support to resolve the suspension."
    },
    "terms": {
      "title": "Terms of service",
      "description": "The rules governing marketplace usage.",
      "cardTitle": "Legal agreement",
      "cardDesc": "Defines direct settlement boundaries and dispute limits."
    }
  },
  "taskerPages": {
    "applicationSent": {
      "title": "Application sent",
      "description": "Your application has been sent to the customer and is waiting for review.",
      "backToFeed": "Back to feed",
      "sentDesc": "Application sent."
    },
    "bookingDetail": {
      "title": "Booking detail",
      "description": "Review booking status, timeline, and support actions.",
      "cardDesc": "Taskers can review the booking and respond to issues here."
    },
    "cancelDialog": {
      "title": "Cancel booking",
      "description": "Cancel an assigned booking with a reason.",
      "cardDesc": "Taskers confirm cancellations before the booking is updated."
    },
    "jobs": {
      "title": "My jobs",
      "description": "Track active and completed tasks you have been hired for.",
      "cardTitle": "Jobs feed",
      "cardDesc": "Switch between active and past work histories."
    },
    "noShowDialog": {
      "title": "No-show reminder",
      "description": "Record a no-show reminder before escalation.",
      "cardDesc": "This keeps the manual verification and dispute process explicit for Phase 1."
    },
    "privacy": {
      "title": "Privacy policy",
      "description": "How tasker data is handled in Phase 1.",
      "cardDesc": "We only show the minimum task details needed to complete assigned jobs safely."
    },
    "profilePolish": {
      "title": "AI profile polish",
      "description": "Refine your tasker profile copy before publishing.",
      "cardDesc": "Phase 1 uses a simple review-and-apply loop for profile improvements."
    },
    "stats": {
      "title": "Tasker stats",
      "description": "View a concise performance summary.",
      "desc1": "Completion rate, rating, and response time stay visible for taskers.",
      "desc2": "Phase 1 keeps the stats surface lightweight and auditable."
    },
    "taskDetail": {
      "title": "Task detail",
      "description": "Review the public task before applying.",
      "desc1": "Task summary, budget, and approximate location are shown here.",
      "desc2": "Manual verification stays intact for Phase 0-1 tasker access."
    }
  },
  "verification": {
    "approved": {
      "title": "Verification approved",
      "description": "Your identity has been approved.",
      "cardDesc": "You can now accept jobs with a verified tasker profile."
    },
    "consent": {
      "title": "Verification consent",
      "description": "Confirm the verification policy before uploading documents.",
      "cardDesc": "By continuing, you confirm that the uploaded documents belong to you."
    },
    "gate": {
      "title": "Identity verification",
      "description": "Start your tasker verification flow.",
      "cardDesc": "Manual review is required before a tasker can accept jobs."
    },
    "pending": {
      "title": "Verification pending",
      "description": "Your submission is awaiting manual review.",
      "cardDesc": "We will notify you when your verification is reviewed."
    },
    "rejected": {
      "title": "Verification rejected",
      "description": "Review the rejection reason and try again.",
      "cardDesc": "Fix the issues noted by the reviewer before resubmitting."
    },
    "submitted": {
      "title": "Verification submitted",
      "description": "Your verification documents are in the queue.",
      "cardDesc": "Submission is recorded and waiting for the reviewer queue."
    },
    "upload": {
      "title": "Upload verification documents",
      "description": "Upload the front and back of your ID card.",
      "cardDesc": "Phase 1 keeps the upload step simple and reviewable."
    }
  },
  "taskCreation": {
    "locationPicker": {
      "mapLocation": "Map Location",
      "clickMap": "Click on the map to place the location pin."
    },
    "photoUpload": {
      "taskPhotos": "Task Photos",
      "addPhoto": "Add Photo",
      "invalidType": "Invalid file type. Only JPG, PNG, and WebP are allowed.",
      "maxPhotos": "You can only upload up to {{max}} photos.",
      "uploadStoredFailed": "Failed to upload image to storage layer."
    },
    "intakeForm": {
      "select": "Select...",
      "yes": "Yes",
      "no": "No",
      "decrement": "Decrement",
      "increment": "Increment"
    }
  }
};

const newMnKeys = {
  "customerPages": {
    "applicants": {
      "title": "Ажил горилогчид",
      "description": "Ажил хийх хүсэлтэй хүмүүстэй танилцан, холбогдох.",
      "loading": "Горилогчдыг ачааллаж байна...",
      "noApplicants": "Горилогч алга",
      "noApplicantsDesc": "Хүн хүсэлт илгээхийг хүлээх эсвэл харагдах байдлаа нэмэгдүүлнэ үү."
    },
    "bookingConfirmed": {
      "title": "Захиалга баталгаажсан",
      "description": "Ажилтныг захиалсан бөгөөд цагийн хуваарь эсвэл аюулгүй байдлын үйлдэл рүү шилжиж болно.",
      "backToBookings": "Захиалгууд руу буцах",
      "summaryTitle": "Баталгаажуулалтын тойм",
      "summaryDesc": "Захиалгын баталгаажуулалт нь 1-р үе шатны шууд төлбөр хийхэд зориулагдаж үлдэнэ."
    },
    "bookingDetail": {
      "title": "Захиалгын дэлгэрэнгүй",
      "description": "Захиалгын төлөвийг шалгах, ажилтан руу зурвас бичих, аюулгүй байдлын арга хэмжээ авах.",
      "openSafety": "Аюулгүй байдал шалгах",
      "nextStep": "Дараагийн алхам",
      "messageTasker": "Ажилтан руу бичих",
      "statusLabel": "Төлөв:",
      "taskerLabel": "Ажилтан:",
      "loadingTitle": "Захиалгыг ачааллаж байна",
      "loadingDesc": "Захиалгын мэдээллийг татаж байна."
    },
    "bookings": {
      "title": "Захиалгууд",
      "description": "Идэвхтэй, дууссан, цуцалсан захиалгуудаа нэг дороос хянах."
    },
    "disputeRaise": {
      "title": "Маргаан үүсгэх",
      "description": "Маргаан үүсгэхдээ 1-р үе шатны төлбөрийн дүрмийг хэвээр эсэхийг баталгаажуулах.",
      "submitAction": "Маргаан илгээх",
      "cardTitle": "Маргаан нээх",
      "cardDesc": "Шалтгаан, нотлох баримт болон шийдлийн хүсэлтээ оруулна уу."
    },
    "disputeStatus": {
      "title": "Маргааны төлөв",
      "description": "Одоогийн маргааны байдал болон дараагийн алхмыг шалгах.",
      "contactSupport": "Тусламжтай холбогдох",
      "cardTitle": "Шийдвэрийн төлөв",
      "cardDesc": "Үйлчлүүлэгч маргаан нээлттэй, шалгагдаж байгаа эсвэл шийдэгдсэн эсэхийг харж чадна."
    },
    "noApplicantRescue": {
      "title": "Горилогч алга",
      "description": "Хэн ч хүсэлт ирүүлээгүй үед ажлыг үргэлжлүүлэн харуулах нь чухал.",
      "boostVisibility": "Харагдацыг нэмэгдүүлэх",
      "recoveryTitle": "Сэргээх боломжууд",
      "recoveryDesc": "Үйлчлүүлэгчид үнэ, цаг эсвэл тайлбараа өөрчлөхийг санал болгох.",
      "rescueTitle": "Аврах хувилбарууд",
      "rescueDesc": "Ажлыг жагсаалтад үлдээж, илүү хямд эсвэл уян хатан байдлаар дахин захиалахыг санал болгох."
    },
    "noShowReminder": {
      "title": "Ирээгүй тухай сануулах",
      "description": "Ажилтан ажлаа тасалсан эсэхийг сануулж, захиалга хүлээгдэж байгааг мэдэгдэх.",
      "close": "Хаах"
    },
    "rebook": {
      "title": "Дахин захиалах",
      "description": "Өмнөх ажлын мэдээллээр шинэ захиалга эхлүүлэх.",
      "continueAction": "Үргэлжлүүлэх",
      "cardTitle": "Дахин захиалах тойм",
      "cardDesc": "Шинэ цаг сонгохдоо ижил үйлчлүүлэгчийн мэдээллийг ашиглана уу."
    },
    "reschedule": {
      "title": "Захиалгын цагийг солих",
      "description": "Захиалгын цагийг шинэчлэх.",
      "saveChanges": "Өөрчлөлтийг хадгалах",
      "cardTitle": "Шинэ цаг сонгох",
      "cardDesc": "Шинэ цаг баталгаажтал хуучин захиалгын цагийг хэвээр үлдээх."
    },
    "taskCancel": {
      "title": "Ажлыг цуцлах уу?",
      "description": "Энэ ажлыг зогсоосноор үйлчлүүлэгчийн идэвхтэй жагсаалтаас устгагдах болно.",
      "keepTask": "Ажлыг үлдээх",
      "cancelTask": "Ажлыг цуцлах"
    },
    "taskSuccess": {
      "title": "Ажил амжилттай нийтлэгдлээ",
      "description": "Таны даалгавар нийтлэгдэж, ажилтнуудад харагдахуйц боллоо.",
      "stepLabel": "Үйлчлүүлэгч нийтэлж дууслаа",
      "backToTasks": "Ажлууд руу буцах",
      "postAnother": "Өөр ажил нэмэх",
      "liveTitle": "Ажил идэвхтэй байна",
      "liveDesc": "Ажилтнууд таны ажлыг харж, хүсэлт илгээх боломжтой боллоо."
    },
    "taskWizard": {
      "title": "Шинэ ажил нийтлэх",
      "description": "Юу хийлгэх, хаана, ямар төсвөөр гэдгээ тайлбарлана уу.",
      "cancelPosting": "Нийтлэхийг болих",
      "progressTitle": "Явц",
      "stepCategory": "Төрөл",
      "stepDetails": "Дэлгэрэнгүй",
      "stepLocation": "Байршил",
      "stepReview": "Хянах",
      "nextStep": "Дараагийнх",
      "back": "Буцах",
      "confirmPost": "Баталгаажуулж нийтлэх",
      "categoryTitle": "Юу хийлгэх хэрэгтэй вэ?",
      "categoryDesc": "Тохирох ажилтныг хурдан олохын тулд ангиллыг сонгоно уу.",
      "detailsTitle": "Ажлын дэлгэрэнгүй",
      "detailsDesc": "Ажилтнуудад илүү сайн ойлгуулахын тулд тодорхой мэдээлэл оруулна уу.",
      "descLabel": "Тайлбар",
      "descPlaceholder": "Хийлгэх ажлаа дэлгэрэнгүй тайлбарлана уу...",
      "descRequired": "Тайлбар шаардлагатай (хамгийн багадаа 10 тэмдэгт).",
      "scheduleLabel": "Хэзээ хийлгэх вэ?",
      "budgetLabel": "Тооцоолсон төсөв (MNT)",
      "budgetInfo": "Энэ бол тооцоолол. Эцсийн үнийг ажилтантай тохиролцох болно.",
      "invalidBudget": "Сонгогдсон ангиллын хамгийн бага үнэд нийцэх, зөв төсөв оруулна уу.",
      "photosTitle": "Ажлын зургууд",
      "photosHelp": "Ажилтнууд таны ажлыг илүү сайн ойлгоход тусална."
    },
    "taskerProfile": {
      "title": "Ажилтны профайл",
      "description": "Ажилтны дэлгэрэнгүйг шалгана уу.",
      "openProfile": "Профайл нээх",
      "primaryActions": "Үндсэн үйлдлүүд",
      "messageTasker": "Ажилтан руу бичих",
      "openChat": "Чат нээх",
      "verifiedTasker": "Баталгаажсан Ажилтан",
      "trustedLabel": "1-р үе шатны шууд төлбөр тооцоонд итгэмжлэгдсэн ажилтан.",
      "ratingStats": "{{count}} ажлаас {{rating}} үнэлгээтэй",
      "responseDetail": "Ажлын цагаар хурдан хариу өгдөг"
    },
    "tasksList": {
      "title": "Миний ажлууд",
      "description": "Нийтлэгдсэн ажлуудаа хянах болон шинэ даалгавар үүсгэх.",
      "postNew": "Шинэ ажил нийтлэх",
      "freshRequestTitle": "Шинэ хүсэлт хэрэгтэй юу?",
      "freshRequestDesc": "Яг ижил урсгалаар дахин шинэ захиалга нэмээрэй.",
      "startPosting": "Нийтэлж эхлэх",
      "loadingError": "Ажлуудыг ачаалахад алдаа гарлаа",
      "tryAgain": "Дахин оролдоно уу.",
      "noTasks": "Одоогоор ажил алга",
      "noTasksDesc": "Эхний ажлаа нийтэлж ажилтнуудаас хүсэлт хүлээж аваарай.",
      "customerTask": "Хэрэглэгчийн ажил",
      "viewDetails": "Дэлгэрэнгүй"
    },
    "timeline": {
      "title": "Захиалгын явц",
      "description": "Баталгаажуулахаас эхлээд дуусах хүртэлх болон маргааны явцыг дагах.",
      "backToBooking": "Захиалга руу буцах",
      "cardTitle": "Цагийн дараалал",
      "confirmedLabel": "Захиалга баталгаажсан",
      "confirmedDesc": "Үйлчлүүлэгч ажилтныг сонгосон",
      "inProgressLabel": "Ажил хийгдэж байна",
      "inProgressDesc": "Ажилтан очиж байна",
      "awaitingLabel": "Дуусахыг хүлээж байна",
      "awaitingDesc": "Эцсийн дүгнэлтийг оруулах эсвэл маргаан үүсгэх"
    }
  },
  "sharedPages": {
    "appUpdate": {
      "title": "Шинэчлэх шаардлагатай",
      "description": "Аппын шинэ хувилбар бэлэн болсон тул шинэчилнэ үү.",
      "updateNow": "Одоо шинэчлэх",
      "cardTitle": "Зайлшгүй өөрчлөлтүүд",
      "cardDesc": "Энэ нь API нийцтэй байдлыг хангахад шаардлагатай."
    },
    "banned": {
      "title": "Бүртгэл хаагдсан",
      "description": "Энэ бүртгэл цаашид системд нэвтрэх боломжгүй."
    },
    "chatDetail": {
      "title": "Харилцах цонх",
      "description": "Идэвхтэй захиалгатай холбоотой шууд чат.",
      "sendMessage": "Зурвас илгээх",
      "messageHistory": "Зурвасын түүх",
      "historyDesc": "Chat UI нь 0-р үе шатны энгийн текстүүд илгээх зориулалттай."
    },
    "deleteAccount": {
      "title": "Бүртгэл устгах",
      "description": "Таны мэдээлэл болон бүртгэлийг бүрмөсөн устгах болно.",
      "confirmDelete": "Устгахыг баталгаажуулах",
      "cardTitle": "Мэдээлэл устгах",
      "cardDesc": "Энэ үйлдлийг буцаах боломжгүй бөгөөд идэвхтэй ажлууд цуцлагдана."
    },
    "editProfile": {
      "title": "Профайл засах",
      "description": "Бусдад харагдах нийтийн мэдээллээ шинэчлэх.",
      "saveChanges": "Өөрчлөлтийг хадгалах",
      "firstName": "Нэр",
      "lastName": "Овог",
      "bio": "Товч намтар",
      "successTitle": "Профайл шинэчлэгдлээ",
      "successDesc": "Өөрчлөлтүүд амжилттай хадгалагдлаа."
    },
    "help": {
      "title": "Тусламжийн төв",
      "description": "Асуултын хариу олох эсвэл дэмжлэгийн багтай холбогдох.",
      "cardTitle": "Түгээмэл асуултууд",
      "cardDesc": "FAQ-г ашиглан хүний оролцоотой тусламжийг бууруулдаг."
    },
    "inbox": {
      "title": "Захидлын хайрцаг",
      "description": "Ажилтан болон үйлчлүүлэгчээс ирсэн шинэ зурвасууд.",
      "cardTitle": "Зурвасын жагсаалт",
      "cardDesc": "Идэвхтэй захиалгын чатын нэгтгэсэн харагдац."
    },
    "networkError": {
      "title": "Холболтын алдаа",
      "description": "Tasky үйлчилгээтэй холбогдож чадсангүй.",
      "retry": "Дахин оролдох",
      "cardTitle": "Интернэт холболтгүй",
      "cardDesc": "Интернэт холболтоо шалгаад дахин оролдоно уу."
    },
    "notifications": {
      "title": "Мэдэгдэл",
      "description": "Шинэ анхааруулга болон мэдээллүүд.",
      "cardTitle": "Үйл ажиллагааны жагсаалт",
      "cardDesc": "Захиалгын өөрчлөлт, төлбөр зэргийг багтаасан мэдэгдлүүд."
    },
    "privacy": {
      "title": "Нууцлалын бодлого",
      "description": "Бид таны мэдээллийг хэрхэн цуглуулж, ашиглаж, хамгаалдаг тухай.",
      "cardTitle": "Мэдээлэл боловсруулах",
      "cardDesc": "Хувийн мэдээлэл болон захиалгын түүхийг хамруулах журам."
    },
    "reviewHardLock": {
      "title": "Өмнөх захиалгаа үнэлэх",
      "description": "Та цааш үргэлжлүүлэхээсээ өмнө сүүлийн гүйцэтгэсэн ажлаа үнэлэх шаардлагатай.",
      "submitReview": "Үнэлгээ илгээх",
      "cardTitle": "Санал хүсэлт шаардлагатай",
      "cardDesc": "Зах зээлийн итгэлцлийг бий болгохын тулд үнэлгээ өгөхийг шаарддаг."
    },
    "review": {
      "title": "Үнэлгээ үлдээх",
      "description": "Гүйлгээ дуусахаас өмнө чанарын богино үнэлгээ өгөх.",
      "submitReview": "Үнэлгээ илгээх",
      "reviewNotes": "Үнэлгээний тайлбар",
      "stars": "{{count}} од",
      "thanksTitle": "Санал хүсэлтээ үлдээсэнд баярлалаа.",
      "thanksDesc": "Үнэлгээ амжилттай хадгалагдлаа.",
      "thanksDescRated": "Үнэлгээ амжилттай хадгалагдлаа: {{rating}}/5."
    },
    "reviewReminder": {
      "title": "Үнэлгээ өгөхөө мартуузай",
      "description": "Өөрийн туршлагаа үнэлж түр хугацаа зарцуулна уу.",
      "close": "Хаах"
    },
    "sessionExpired": {
      "title": "Хугацаа дууссан",
      "description": "Аппликейшнийг үргэлжлүүлэн ашиглахын тулд дахин нэвтэрнэ үү."
    },
    "settings": {
      "title": "Тохиргоо",
      "description": "Мэдэгдэл, хэл болон бусад тохиргоог удирдах.",
      "cardTitle": "Аппын тохиргоо",
      "cardDesc": "Анхааруулга болон хэлний сонголт хийх."
    },
    "suspended": {
      "title": "Бүртгэл түр хаагдсан",
      "description": "Энэхүү бүртгэлд түр хугацаагаар хязгаарлалт тавьсан байна.",
      "cardTitle": "Шалгах ажиллагаа явагдаж байна",
      "cardDesc": "Хязгаарлалтыг шийдвэрлэхийн тулд тусламжийн багтай холбогдоно уу."
    },
    "terms": {
      "title": "Үйлчилгээний нөхцөл",
      "description": "Маркетплейсийн ашиглалтыг зохицуулах дүрэм.",
      "cardTitle": "Эрх зүйн баримт бичиг",
      "cardDesc": "Маргаан шийдвэрлэх болон гэрээний нөхцөлүүдийг тодорхойлно."
    }
  },
  "taskerPages": {
    "applicationSent": {
      "title": "Ажилд орох хүсэлт илгээгдлээ",
      "description": "Таны хүсэлт үйлчлүүлэгч рүү очсон бөгөөд шалгахыг хүлээж байна.",
      "backToFeed": "Буцах",
      "sentDesc": "Хүсэлт илгээгдлээ."
    },
    "bookingDetail": {
      "title": "Захиалгын дэлгэрэнгүй",
      "description": "Захиалгын байдал, явц болон туслалцааны талаар мэдээлэл.",
      "cardDesc": "Ажилтан захиалгатай танилцаж, асуудлуудад хариу өгөх боломжтой."
    },
    "cancelDialog": {
      "title": "Захиалга цуцлах",
      "description": "Хоёр талын баталгаажсан захиалгыг шалтгаантайгаар цуцлах.",
      "cardDesc": "Захиалгыг цуцлахын өмнө ажилтан баталгаажуулна."
    },
    "jobs": {
      "title": "Миний ажлууд",
      "description": "Таны ажиллаж буй болон дуусгасан ажлуудын хяналт.",
      "cardTitle": "Ажлуудын жагсаалт",
      "cardDesc": "Идэвхтэй болон өмнөх гүйцэтгэлийн түүхийг харах."
    },
    "noShowDialog": {
      "title": "Ирээгүй дохиолол",
      "description": "Маргаан үүсэхээс өмнө сануулга илгээнэ үү.",
      "cardDesc": "Энэ нь 1-р үе шатны маргаан болон шалгах үйл явцыг бүртгэх зорилготой."
    },
    "privacy": {
      "title": "Нууцлалын бодлого",
      "description": "Ажилтны мэдээлэл 1-р үе шатанд хэрхэн зохицуулагддаг талаар.",
      "cardDesc": "Бид ажлыг гүйцэтгэхэд шаардлагатай хамгийн бага мэдээллийг л үзүүлдэг."
    },
    "profilePolish": {
      "title": "Профайл сайжруулагч AI",
      "description": "Өөрийн профайлыг нийтлэхийн өмнө хуулбарын чанарыг сайжруулаарай.",
      "cardDesc": "1-р үе шатанд профайл сайжруулах энгийн алхмуудыг ашиглана."
    },
    "stats": {
      "title": "Ажилтны үзүүлэлт",
      "description": "Гүйцэтгэлийн хураангуйг үзэх.",
      "desc1": "Амжилтын хувь, үнэлгээ, хариу өгөх хугацааг харуулна.",
      "desc2": "1-р шатанд үзүүлэлтүүдийг илүү хялбар, баталгаатай байлгана."
    },
    "taskDetail": {
      "title": "Ажлын мэдээлэл",
      "description": "Ажилд орох хүсэлт өгөхөөс өмнө ажлыг нягтлан үзнэ үү.",
      "desc1": "Төсөв, бүдүүвчилсэн байршил, ажлын товч мэдээллийг энд харуулна.",
      "desc2": "0-ээс 1-р үе шатанд ажилтан баталгаажих үйл явц хэвээр байх болно."
    }
  },
  "verification": {
    "approved": {
      "title": "Баталгаажсан",
      "description": "Таны хэн болох нь батлагдлаа.",
      "cardDesc": "Та одоо баталгаажсан ажилтны хувиар ажил хүлээн авах боломжтой."
    },
    "consent": {
      "title": "Баталгаажуулах зөвшөөрөл",
      "description": "Бичиг баримт байршуулахын өмнө журмыг зөвшөөрнө үү.",
      "cardDesc": "Та байршуулсан бичиг баримт өөрийнх гэдгийг батална."
    },
    "gate": {
      "title": "Биеийн байцаалт баталгаажуулах",
      "description": "Бүртгэл баталгаажуулах үйлдлийг эхлүүлнэ үү.",
      "cardDesc": "Ажил авахын тулд манай багийн гараарх хяналт шаардлагатай."
    },
    "pending": {
      "title": "Баталгаажуулалт хүлээгдэж байна",
      "description": "Таны бүртгэл хянагдаж байна.",
      "cardDesc": "Бид таныг шалгаж дууссан үед мэдэгдэх болно."
    },
    "rejected": {
      "title": "Баталгаажилт амжилтгүй",
      "description": "Татгалзсан шалтгааныг уншаад дахин оролдоно уу.",
      "cardDesc": "Хянагчийн үлдээсэн алдааг засч байж дахин явуулаарай."
    },
    "submitted": {
      "title": "Хүсэлт илгээгдсэн",
      "description": "Таны баримтууд дараалалд орлоо.",
      "cardDesc": "Мэдээлэл амжилттай бүртгэгдэж, шалгагч хүлээж байна."
    },
    "upload": {
      "title": "Баримт бичиг байршуулах",
      "description": "Иргэний үнэмлэхний урд болон хойд талыг зургаар оруулна уу.",
      "cardDesc": "1-р үе шат нь байршуулах алхмыг энгийн байлгадаг."
    }
  },
  "taskCreation": {
    "locationPicker": {
      "mapLocation": "Газрын зураг",
      "clickMap": "Байршлыг тэмдэглэхийн тулд газрын зураг дээр дарна уу."
    },
    "photoUpload": {
      "taskPhotos": "Ажлын зургууд",
      "addPhoto": "Зураг нэмэх",
      "invalidType": "Буруу файл. Зөвхөн JPG, PNG, эсвэл WebP зөвшөөрөгдөнө.",
      "maxPhotos": "Та дээд тал нь {{max}} зураг оруулах боломжтой.",
      "uploadStoredFailed": "Зургийг санах ойд хадгалж чадсангүй."
    },
    "intakeForm": {
      "select": "Сонгох...",
      "yes": "Тийм",
      "no": "Үгүй",
      "decrement": "Хасах",
      "increment": "Нэмэх"
    }
  }
};

Object.assign(enJson, newEnKeys);
Object.assign(mnJson, newMnKeys);

fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2));
fs.writeFileSync(mnPath, JSON.stringify(mnJson, null, 2));

console.log('Successfully updated translation files.');
