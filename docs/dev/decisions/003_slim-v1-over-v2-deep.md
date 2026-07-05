# 003 — Slim V1 채택, v2 deep (03B/C/D) 폐기

**날짜:** 2026-06-28  
**상태:** 확정

---

## 배경

v2 deep self 파이프라인(03B→03C→03D)과 v1 유료 통합 리포트를 비교·실험했으나, Blueprint 심화에는 **설문 6축 + 기질(신살) + 점성**만 필요하고 관계 맥락·18문항 Y/N은 제외하기로 함.

---

## 선택지

### A. v2 deep 03B/C/D 유지 + v1 병행

- 장점: 스펙 문서와 코드 정렬 가능
- 단점: 파이프라인 2개 유지, 디버그·캐시 복잡

### B. Slim V1 (`lib/v1/slim` + `integratedPremiumReport`) 단일화

- 장점: 단순, 기존 유료 프롬프트 재사용, 검수 빠름
- 단점: 03B~D 스펙 문서는 dead letter

---

## 결정

**선택:** B (Slim V1)

**이유:** 입력 3종으로 충분하고, 실험 deep 코드는 유지 비용만 큼. v2 설문·Blueprint·Lite는 그대로 코어.

---

## 영향

- 바뀌는 것: `/innate/deep`, `lib/v1/slim/*`, 출생 지역 필수
- 삭제: `lib/v2/deep/*`, deep signal 추출, 03B/C/D 런타임
- 안 바뀌는 것: `lib/v2/survey`, lite, gap, 유료 `/report` (별도 정리 예정)

---

## 관련

- Daily: `docs/dev/daily/2026-06-28.md`
- 맵: `docs/dev/CORE_MAP.md`
