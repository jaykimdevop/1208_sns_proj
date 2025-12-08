/**
 * @file formatRelativeTime.ts
 * @description 상대 시간 표시 유틸리티 함수
 *
 * 날짜를 상대 시간 형식으로 변환합니다.
 * 예: "방금 전", "3분 전", "2시간 전", "3일 전", "2주 전", "1개월 전", "1년 전"
 * 1년 이상 경과한 경우: "YYYY년 M월 D일" 형식
 *
 * @example
 * ```ts
 * formatRelativeTime(new Date(Date.now() - 1000 * 60 * 5)); // "5분 전"
 * formatRelativeTime(new Date(Date.now() - 1000 * 60 * 60 * 2)); // "2시간 전"
 * formatRelativeTime(new Date('2023-01-01')); // "2023년 1월 1일"
 * ```
 */

/**
 * 상대 시간을 포맷팅합니다.
 *
 * @param date - 포맷팅할 날짜 (Date 객체 또는 ISO 8601 문자열)
 * @returns 상대 시간 문자열
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - targetDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  // 1년 이상 경과한 경우: "YYYY년 M월 D일" 형식
  if (diffYears >= 1) {
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;
    const day = targetDate.getDate();
    return `${year}년 ${month}월 ${day}일`;
  }

  // 1개월 이상 경과한 경우
  if (diffMonths >= 1) {
    return `${diffMonths}개월 전`;
  }

  // 1주 이상 경과한 경우
  if (diffWeeks >= 1) {
    return `${diffWeeks}주 전`;
  }

  // 1일 이상 경과한 경우
  if (diffDays >= 1) {
    return `${diffDays}일 전`;
  }

  // 1시간 이상 경과한 경우
  if (diffHours >= 1) {
    return `${diffHours}시간 전`;
  }

  // 1분 이상 경과한 경우
  if (diffMinutes >= 1) {
    return `${diffMinutes}분 전`;
  }

  // 1분 미만인 경우
  return "방금 전";
}

