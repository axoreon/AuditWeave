export const CONTACT_TOPICS = [
  { id: "feedback", label: "General Feedback & Suggestions" },
  { id: "vulnerability", label: "Security Vulnerability Report" },
  { id: "integration", label: "API Integration Support" },
  { id: "bug", label: "Platform Bug / Error filing" },
  { id: "other", label: "Other" },
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number]["id"];
export type ContactField = "name" | "email" | "topic" | "otherTopic" | "message";

export interface ContactFormValues {
  name: string;
  email: string;
  topic: string;
  otherTopic: string;
  message: string;
}

export interface NormalizedContactFormValues {
  name: string;
  email: string;
  topic: ContactTopic;
  other_topic?: string;
  message: string;
}

export type ContactFieldErrors = Partial<Record<ContactField, string>>;

export const CONTACT_NAME_MAX_LENGTH = 100;
export const CONTACT_EMAIL_MAX_LENGTH = 254;
export const CONTACT_OTHER_TOPIC_MAX_LENGTH = 100;
export const CONTACT_MESSAGE_MIN_LENGTH = 10;
export const CONTACT_MESSAGE_MAX_LENGTH = 5000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isContactTopic(value: string): value is ContactTopic {
  return CONTACT_TOPICS.some((topic) => topic.id === value);
}

export function validateContactForm(values: ContactFormValues): {
  errors: ContactFieldErrors;
  normalized: NormalizedContactFormValues | null;
} {
  const name = values.name.trim();
  const email = values.email.trim().toLowerCase();
  const otherTopic = values.otherTopic.trim();
  const message = values.message.trim();
  const errors: ContactFieldErrors = {};

  if (!name) {
    errors.name = "Enter your name.";
  } else if (name.length > CONTACT_NAME_MAX_LENGTH) {
    errors.name = `Name must be ${CONTACT_NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (!email) {
    errors.email = "Enter your email address.";
  } else if (email.length > CONTACT_EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!isContactTopic(values.topic)) {
    errors.topic = "Choose a valid support category.";
  }

  if (values.topic === "other") {
    if (!otherTopic) {
      errors.otherTopic = "Tell us what your request is about.";
    } else if (otherTopic.length > CONTACT_OTHER_TOPIC_MAX_LENGTH) {
      errors.otherTopic = `Category must be ${CONTACT_OTHER_TOPIC_MAX_LENGTH} characters or fewer.`;
    }
  }

  if (!message) {
    errors.message = "Enter a message.";
  } else if (message.length < CONTACT_MESSAGE_MIN_LENGTH) {
    errors.message = `Message must be at least ${CONTACT_MESSAGE_MIN_LENGTH} characters.`;
  } else if (message.length > CONTACT_MESSAGE_MAX_LENGTH) {
    errors.message = `Message must be ${CONTACT_MESSAGE_MAX_LENGTH} characters or fewer.`;
  }

  if (Object.keys(errors).length || !isContactTopic(values.topic)) {
    return { errors, normalized: null };
  }

  return {
    errors,
    normalized: {
      name,
      email,
      topic: values.topic,
      ...(values.topic === "other" ? { other_topic: otherTopic } : {}),
      message,
    },
  };
}
