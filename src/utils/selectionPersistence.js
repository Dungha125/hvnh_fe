/** sessionStorage keys for filter/course picks (survives back navigation, cleared with tab). */
export const SS_KEYS = {
  adminProblemsSubject: "hvnh_sel_admin_problems_subject_id",
  adminRankingSubject: "hvnh_sel_admin_ranking_subject_id",
  adminRankingSemester: "hvnh_sel_admin_ranking_semester_id",
  lecturerContestConfigCourse: "hvnh_sel_lecturer_contest_config_course",
  lecturerClassConfigCourse: "hvnh_sel_lecturer_class_config_course",
  adminContestConfigSubject: "hvnh_sel_admin_contest_config_subject",
  adminClassFilterSubject: "hvnh_sel_admin_class_filter_subject",
  adminClassFilterSemester: "hvnh_sel_admin_class_filter_semester",
  lecturerClassConfigCourse: "hvnh_sel_lecturer_class_config_course",
};

/**
 * @param {string|null|undefined} savedRaw
 * @param {unknown[]} options
 * @param {(o: unknown) => string|number} getValue
 * @returns {string|number|null}
 */
export function restorePick(savedRaw, options, getValue = (o) => o.value) {
  if (savedRaw == null || savedRaw === "" || !Array.isArray(options) || !options.length) {
    return null;
  }
  const s = String(savedRaw);
  const found = options.find((o) => String(getValue(o)) === s);
  return found != null ? getValue(found) : null;
}
