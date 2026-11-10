"use client";

import { clsx } from "clsx";
import { Trash2Icon } from "lucide-react";

import type { CalendarRef } from "../../core/model";
import { useCalendarLocalization } from "../../i18n/calendar-localization";
import { resolvePortalContainer } from "../primitives/portal-layer";
import { Popover } from "../primitives/popover/popover";

import styles from "./calendar-list.module.css";

export interface CalendarOptionsActions {
  /** Hides every other calendar. */
  readonly onShowOnlyCalendar?: (calendarId: string) => void;
  /** Restores the visibility from before the calendar was shown alone. */
  readonly onShowPreviouslyVisible?: () => void;
  /** Marks the calendar as the default for new events. */
  readonly onMakeDefaultCalendar?: (calendarId: string) => void;
  /** Deletes the calendar. The host confirms before it deletes. */
  readonly onDeleteCalendar?: (calendarId: string) => void;
}

interface CalendarOptionsMenuProps {
  readonly actions: CalendarOptionsActions;
  readonly anchorElement: HTMLElement;
  readonly calendar: CalendarRef;
  readonly onClose: () => void;
  /** True while this calendar is the only one shown. */
  readonly solo: boolean;
}

export const CalendarOptionsMenu = ({
  actions,
  anchorElement,
  calendar,
  onClose,
  solo,
}: CalendarOptionsMenuProps) => {
  const { t } = useCalendarLocalization();
  const {
    onDeleteCalendar,
    onMakeDefaultCalendar,
    onShowOnlyCalendar,
    onShowPreviouslyVisible,
  } = actions;

  // The menu is mounted only while open, so each open starts from the menu.
  const choose = (action: () => void): void => {
    action();
    onClose();
  };

  return (
    <Popover
      open
      onOpenChange={() => onClose()}
      anchorRect={anchorElement.getBoundingClientRect()}
      anchorRectProvider={() => anchorElement.getBoundingClientRect()}
      anchorElement={anchorElement}
      align="start"
      container={resolvePortalContainer(anchorElement)}
      label={t("calendar.list.options")}
      className={styles.menu}
    >
      <ul className={styles.menuList}>
        {solo ? (
          onShowPreviouslyVisible === undefined ? null : (
            <li>
              <button
                className={styles.menuItem}
                type="button"
                onClick={() => choose(onShowPreviouslyVisible)}
              >
                {t("calendar.list.showPreviouslyVisible")}
              </button>
            </li>
          )
        ) : onShowOnlyCalendar === undefined ? null : (
          <li>
            <button
              className={styles.menuItem}
              type="button"
              onClick={() => choose(() => onShowOnlyCalendar(calendar.id))}
            >
              {t("calendar.list.showOnly")}
            </button>
          </li>
        )}
        {onMakeDefaultCalendar === undefined ? null : (
          <li>
            <button
              className={styles.menuItem}
              disabled={
                calendar.isDefault === true || calendar.canWrite !== true
              }
              type="button"
              onClick={() => choose(() => onMakeDefaultCalendar(calendar.id))}
            >
              {t("calendar.list.makeDefault")}
            </button>
          </li>
        )}
        {onDeleteCalendar === undefined ? null : (
          <li>
            <button
              className={clsx(styles.menuItem, styles.menuItemStart)}
              disabled={calendar.canDelete !== true}
              type="button"
              onClick={() => choose(() => onDeleteCalendar(calendar.id))}
            >
              <Trash2Icon aria-hidden="true" className={styles.menuIcon} />
              {t("calendar.list.delete")}
            </button>
          </li>
        )}
      </ul>
    </Popover>
  );
};
