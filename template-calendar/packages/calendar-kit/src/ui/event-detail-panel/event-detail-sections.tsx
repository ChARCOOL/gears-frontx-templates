"use client";

import { clsx } from "clsx";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Fragment } from "react";
import type { ReactNode } from "react";

import type {
  CalendarAttendee,
  CalendarConflict,
  CalendarEvent,
  IanaTimeZone,
} from "../../core/model";
import { useCalendarContext } from "../../i18n/calendar-context";
import { useCalendarLocalization } from "../../i18n/calendar-localization";
import type { EventDetailPanelCopyStatus } from "../../react/public";
import { ConflictIndicator } from "../conflict-indicator/conflict-indicator";
import { Avatar } from "../primitives/avatar/avatar";
import { Button } from "../primitives/button/button";
import { activationKeyDown } from "./event-detail-activation";
import {
  COPY_STATUS_KEYS,
  attendanceSummaryParts,
  formatAttendanceSummary,
  formatEventRange,
  formatRecurrenceSummary,
  formatZoneLine,
  guestCount,
} from "./event-detail-panel-format";

import styles from "./event-detail-panel.module.css";

interface DetailRowProps {
  readonly children: ReactNode;
  /** Class added to the row's content. */
  readonly className?: string;
  /** The visible field label, above the row's content. Omit it when the text says what it is. */
  readonly label?: string;
}

const DetailRow = ({ children, className, label }: DetailRowProps) => (
  <section className={styles.row}>
    {label === undefined ? null : (
      <h3 className={styles.sectionLabel}>{label}</h3>
    )}
    <div className={clsx(styles.rowContent, className)}>{children}</div>
  </section>
);

export const RestrictedSection = ({
  event,
}: {
  readonly event: CalendarEvent;
}) => {
  const { locale, t } = useCalendarLocalization();
  const { timeZone } = useCalendarContext();

  return (
    <div className={styles.group} role="note">
      <DetailRow label={t("calendar.detail.dateTime")}>
        <p className={styles.mutedText}>
          {formatEventRange(event, timeZone, locale)}
        </p>
      </DetailRow>
      <DetailRow>
        <p className={styles.mutedText}>{t("calendar.detail.restricted")}</p>
      </DetailRow>
    </div>
  );
};

const OrganizerSection = ({ event }: { readonly event: CalendarEvent }) => {
  const { t } = useCalendarLocalization();
  const organizer = event.organizer ?? "";
  const email = event.organizerEmail ?? "";

  if (organizer === "") {
    return null;
  }

  return (
    <DetailRow label={t("calendar.detail.organizer")}>
      <div className={styles.person}>
        <Avatar className={styles.stackAvatar} decorative name={organizer} />
        <div className={styles.personText}>
          <p className={styles.text}>{organizer}</p>
          {email === "" ? null : <p className={styles.personMeta}>{email}</p>}
        </div>
      </div>
    </DetailRow>
  );
};

interface CopyLinkButtonProps {
  readonly copyStatus: EventDetailPanelCopyStatus;
  readonly onCopy: () => void;
}

const CopyLinkButton = ({ copyStatus, onCopy }: CopyLinkButtonProps) => {
  const { t } = useCalendarLocalization();

  return (
    <Button
      variant="tertiary"
      size="m"
      leftIcon={copyStatus === "copied" ? <CheckIcon /> : <CopyIcon />}
      onClick={onCopy}
      onKeyDown={activationKeyDown(onCopy)}
    >
      {t(COPY_STATUS_KEYS[copyStatus])}
    </Button>
  );
};

interface ConferencingSectionProps {
  readonly canCopyJoinLink: boolean;
  readonly copyLink: () => void;
  readonly copyStatus: EventDetailPanelCopyStatus;
  readonly joinUrl: string;
}

const ConferencingSection = ({
  canCopyJoinLink,
  copyLink,
  copyStatus,
  joinUrl,
}: ConferencingSectionProps) => {
  const { t } = useCalendarLocalization();

  return (
    <DetailRow label={t("calendar.detail.conferencing")}>
      {canCopyJoinLink ? (
        <div className={styles.conferencingRow}>
          <a
            className={styles.joinButton}
            href={joinUrl}
            rel="noreferrer"
            target="_blank"
          >
            {t("calendar.detail.join")}
          </a>
          <CopyLinkButton copyStatus={copyStatus} onCopy={copyLink} />
        </div>
      ) : (
        <p className={styles.mutedText}>{joinUrl}</p>
      )}
    </DetailRow>
  );
};

interface ParticipantsSectionProps {
  readonly event: CalendarEvent;
  /** Lists every guest by response in place of the avatar stack. */
  readonly showAllGuests: boolean;
  readonly onShowAllGuests: () => void;
  readonly participantOverflowCount: number;
  readonly visibleParticipants: readonly CalendarAttendee[];
}

// +N swaps the stack for a scrolling guest list, so a large invite never fills the panel with avatars.
const ParticipantsSection = ({
  event,
  showAllGuests,
  onShowAllGuests,
  participantOverflowCount,
  visibleParticipants,
}: ParticipantsSectionProps) => {
  const { t } = useCalendarLocalization();

  if (guestCount(event) === 0) {
    return null;
  }

  return (
    <DetailRow
      label={t("calendar.detail.participants")}
      className={styles.participantsRow}
    >
      {showAllGuests ? (
        <GuestGroups attendees={event.attendees ?? []} />
      ) : (
        visibleParticipants.length > 0 && (
          <ul className={styles.avatarStack}>
            {visibleParticipants.map((participant) => (
              <li key={participant.id} title={participant.displayName}>
                <Avatar
                  className={styles.stackAvatar}
                  name={participant.displayName}
                />
              </li>
            ))}
            {participantOverflowCount > 0 && (
              <li>
                <button
                  type="button"
                  className={styles.stackOverflow}
                  aria-label={`+${participantOverflowCount} ${t("calendar.detail.participants.more")}`}
                  onClick={onShowAllGuests}
                >
                  +{participantOverflowCount}
                </button>
              </li>
            )}
          </ul>
        )
      )}
      <p className={styles.attendanceSummary}>
        {/* Read as one line; the dotted parts are only the visual form of it. */}
        <span className={styles.visuallyHidden}>
          {formatAttendanceSummary(event, t)}
        </span>
        {attendanceSummaryParts(event, t).map((part, index) => (
          <Fragment key={part}>
            {index > 0 && (
              <span aria-hidden="true" className={styles.summaryDot}>
                ●
              </span>
            )}
            <span aria-hidden="true">{part}</span>
          </Fragment>
        ))}
      </p>
    </DetailRow>
  );
};

const TimeZoneSection = ({
  comparisonTimeZone,
  event,
}: {
  readonly comparisonTimeZone: IanaTimeZone | null;
  readonly event: CalendarEvent;
}) => {
  const { locale, t } = useCalendarLocalization();
  const { timeZone } = useCalendarContext();

  if (event.allDay) {
    return null;
  }

  const zones =
    comparisonTimeZone === null || comparisonTimeZone === timeZone
      ? [timeZone]
      : [timeZone, comparisonTimeZone];

  return (
    <DetailRow label={t("calendar.detail.timeZone")}>
      {zones.map((zone) => (
        <p key={zone} className={styles.mutedText}>
          {formatZoneLine(event, zone, locale)}
        </p>
      ))}
    </DetailRow>
  );
};

// An attendee without a response is only invited; "awaiting" is a response the host reported.
type ResponseGroup = "yes" | "maybe" | "no" | "awaiting" | "unknown";

const RESPONSE_GROUPS: readonly ResponseGroup[] = [
  "yes",
  "no",
  "maybe",
  "awaiting",
  "unknown",
];

const GROUP_OF_RESPONSE: Readonly<
  Record<NonNullable<CalendarAttendee["response"]>, ResponseGroup>
> = {
  accepted: "yes",
  declined: "no",
  "needs-action": "awaiting",
  tentative: "maybe",
};

const responseGroup = ({ response }: CalendarAttendee): ResponseGroup =>
  response === null || response === undefined
    ? "unknown"
    : GROUP_OF_RESPONSE[response];

const GuestGroups = ({
  attendees,
}: {
  readonly attendees: readonly CalendarAttendee[];
}) => {
  const { t } = useCalendarLocalization();

  return RESPONSE_GROUPS.map((group) => {
    const members = attendees.filter(
      (attendee) => responseGroup(attendee) === group
    );

    if (members.length === 0) {
      return null;
    }

    return (
      <div key={group} className={styles.inviteeGroup}>
        <p className={styles.groupLabel}>
          {t(`calendar.detail.group.${group}`, { count: members.length })}
        </p>
        <ul className={styles.invitees}>
          {members.map((attendee) => (
            <li key={attendee.id} className={styles.person}>
              <Avatar
                className={styles.stackAvatar}
                decorative
                name={attendee.displayName}
              />
              <div className={styles.personText}>
                <p className={styles.text}>{attendee.displayName}</p>
                {(attendee.email ?? "") === "" ? null : (
                  <p className={styles.personMeta}>{attendee.email}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  });
};

const renderConflictDetail = (conflict: CalendarConflict) => (
  <>
    <span className={styles.conflictDimension}>{conflict.dimension}</span>
    <span className={styles.conflictLabel}>{conflict.label}</span>
    {typeof conflict.message === "string" && (
      <span className={styles.conflictMessage}>{conflict.message}</span>
    )}
  </>
);

export interface DefaultDetailProps {
  readonly canCopyJoinLink: boolean;
  readonly comparisonTimeZone: IanaTimeZone | null;
  readonly copyLink: () => void;
  readonly copyStatus: EventDetailPanelCopyStatus;
  readonly event: CalendarEvent;
  readonly joinUrl: string | undefined;
  /** Opens the full guest list from the avatar stack's +N. */
  readonly onShowAllGuests: () => void;
  readonly participantOverflowCount: number;
  /** Lists every guest in place of the avatar stack. */
  readonly showAllGuests: boolean;
  readonly visibleParticipants: readonly CalendarAttendee[];
}

export const DefaultDetail = ({
  canCopyJoinLink,
  comparisonTimeZone,
  copyLink,
  copyStatus,
  event,
  joinUrl,
  onShowAllGuests,
  participantOverflowCount,
  showAllGuests,
  visibleParticipants,
}: DefaultDetailProps) => {
  const { locale, t } = useCalendarLocalization();
  const { timeZone } = useCalendarContext();
  const recurrenceSummary = formatRecurrenceSummary(event, t, locale);
  const conflicts = event.conflicts ?? [];
  const location = event.location ?? "";
  const description = event.description ?? "";

  // Groups render even when every row in them is empty; the stylesheet hides empty groups and
  // draws a rule only between groups that have content.
  return (
    <>
      <div className={styles.group}>
        <DetailRow label={t("calendar.detail.dateTime")}>
          <p className={styles.mutedText}>
            {formatEventRange(event, timeZone, locale)}
          </p>
          {recurrenceSummary !== undefined && (
            <p className={styles.mutedText}>{recurrenceSummary}</p>
          )}
        </DetailRow>
        <OrganizerSection event={event} />
        {joinUrl !== undefined && (
          <ConferencingSection
            canCopyJoinLink={canCopyJoinLink}
            copyLink={copyLink}
            copyStatus={copyStatus}
            joinUrl={joinUrl}
          />
        )}
        <ParticipantsSection
          event={event}
          showAllGuests={showAllGuests}
          onShowAllGuests={onShowAllGuests}
          participantOverflowCount={participantOverflowCount}
          visibleParticipants={visibleParticipants}
        />
      </div>
      <div className={styles.group}>
        {location !== "" && (
          <DetailRow label={t("calendar.detail.location")}>
            <p className={styles.mutedText}>{location}</p>
          </DetailRow>
        )}
        {conflicts.length > 0 && (
          <DetailRow label={t("calendar.detail.conflicts")}>
            <ConflictIndicator
              className={styles.conflicts}
              conflicts={conflicts}
              renderConflict={renderConflictDetail}
            />
          </DetailRow>
        )}
        <TimeZoneSection
          comparisonTimeZone={comparisonTimeZone}
          event={event}
        />
        {description !== "" && (
          <DetailRow label={t("calendar.detail.description")}>
            <p className={styles.description}>{description}</p>
          </DetailRow>
        )}
      </div>
    </>
  );
};
