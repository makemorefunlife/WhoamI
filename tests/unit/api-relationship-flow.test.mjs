import test from "node:test";
import assert from "node:assert/strict";

test("API Relationship Flow Integration Guard", async (t) => {
  const sampleReportId = "51e60cca-8596-4634-87e7-ca3b6468b14c";

  await t.test("1. Relationship list API returns HTTP 200 and relationships array", async () => {
    const res = await fetch(`http://localhost:3000/api/relationship/list?reportId=${sampleReportId}`);
    assert.equal(res.status, 200, "API /api/relationship/list must return HTTP 200");

    const data = await res.json();
    assert.ok(Array.isArray(data.relationships), "Response must contain relationships array");
    assert.ok(data.relationships.length > 0, "Registered relationships must be returned");
  });

  await t.test("2. Unauthenticated manual friend creation succeeds without DB constraint errors", async () => {
    const res = await fetch("http://localhost:3000/api/relationship/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportIdA: sampleReportId,
        partnerName: "자동화테스트친구",
        birthDate: "1996-06-06",
        birthTime: "14:00",
        birthTimeUnknown: false,
        birthPlace: "서울특별시",
        birthPlaceUnknown: false,
        surveySkipped: true,
      }),
    });

    assert.equal(res.status, 200, "Manual relationship creation must return HTTP 200");
    const data = await res.json();
    assert.equal(data.ok, true, "Response ok must be true");
    assert.ok(data.relationship_report_id, "relationship_report_id must be created");
  });
});
