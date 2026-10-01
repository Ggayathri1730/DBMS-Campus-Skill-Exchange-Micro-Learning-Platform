import unittest

from routers.matches import build_match_results


class MatchResultsTests(unittest.TestCase):
    def test_returns_one_way_and_reciprocal_matches_without_self_matches(self):
        own_skills = [
            {"skill_id": 1, "skill_name": "Python", "can_teach": True, "wants_to_learn": False},
            {"skill_id": 2, "skill_name": "Java", "can_teach": False, "wants_to_learn": True},
        ]
        other_skills = [
            {"student_id": 1, "student_name": "Current Student", "course": "CS", "year": "2", "skill_id": 2, "skill_name": "Java", "can_teach": True, "wants_to_learn": False},
            {"student_id": 2, "student_name": "Aarav Mehta", "course": "CS", "year": "3", "skill_id": 2, "skill_name": "Java", "can_teach": True, "wants_to_learn": False},
            {"student_id": 2, "student_name": "Aarav Mehta", "course": "CS", "year": "3", "skill_id": 1, "skill_name": "Python", "can_teach": False, "wants_to_learn": True},
            {"student_id": 3, "student_name": "Diya Nair", "course": "ECE", "year": "2", "skill_id": 2, "skill_name": "Java", "can_teach": True, "wants_to_learn": False},
        ]

        matches = build_match_results(1, own_skills, other_skills)

        self.assertEqual([item["student_id"] for item in matches], [2, 3])
        self.assertEqual(matches[0]["match_type"], "reciprocal")
        self.assertEqual(matches[0]["reciprocal_skills"], ["Python"])
        self.assertEqual(matches[1]["match_type"], "one_way")
        self.assertEqual(matches[1]["wants"], "")
        self.assertEqual(matches[0]["skill_id"], 2)


if __name__ == "__main__":
    unittest.main()