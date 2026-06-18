import { CONTROLLED_SUBSTANCE_QUICK_LOOKUP, TOP_200_DRUGS } from "../content/drugBank.js";
import { PTCB_DOMAINS } from "../content/blueprint.js";
import { SIG_CODES } from "../content/sigCodes.js";

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function unique(items) {
  return Array.from(new Set(items));
}

function sortBySeed(items, seedKey, accessor = (item) => item.id ?? item) {
  return [...items].sort((left, right) => {
    const leftSeed = hashString(`${seedKey}:${accessor(left)}`);
    const rightSeed = hashString(`${seedKey}:${accessor(right)}`);
    return leftSeed - rightSeed;
  });
}

function pickDistractors(items, correctValue, count, seedKey) {
  return sortBySeed(
    unique(items).filter((item) => item !== correctValue),
    seedKey,
    (item) => item,
  ).slice(0, count);
}

function makeQuestion({
  id,
  domain,
  topic,
  prompt,
  choices,
  answerIndex,
  explanation,
  incorrectExplanations,
  tags = [],
  objective,
  difficulty = "core",
}) {
  return {
    id,
    domain,
    topic,
    prompt,
    choices,
    answerIndex,
    explanation,
    incorrectExplanations,
    tags,
    objective,
    difficulty,
  };
}

const HALLMARK_SIDE_EFFECT_IDS = [
  "lisinopril",
  "amlodipine",
  "digoxin",
  "warfarin",
  "semaglutide",
  "citalopram",
  "bupropion-xl",
  "olanzapine",
  "lithium",
  "phenytoin",
  "topiramate",
  "hydrocodone-acetaminophen",
  "doxycycline",
  "metronidazole",
  "finasteride",
  "alendronate",
  "benzonatate",
  "nitroglycerin-sl",
];

const SPECIAL_HANDLING_IDS = [
  "insulin-glargine",
  "nitroglycerin-sl",
  "dabigatran",
  "benzonatate",
  "testosterone-gel",
  "finasteride",
  "alendronate",
  "semaglutide",
  "lidocaine-patch",
  "epinephrine-auto-injector",
];

const medicationDrugs = TOP_200_DRUGS;
const brandPool = medicationDrugs.map((drug) => drug.brand);
const classPool = unique(medicationDrugs.map((drug) => drug.drugClass));
const indicationPool = unique(medicationDrugs.map((drug) => drug.indication));
const sideEffectPool = unique(medicationDrugs.map((drug) => drug.sideEffect));

function buildBrandQuestions() {
  return medicationDrugs.slice(0, 80).map((drug) => {
    const distractors = pickDistractors(brandPool, drug.brand, 3, `${drug.id}:brand`);
    const choices = sortBySeed([drug.brand, ...distractors], `${drug.id}:brand-choices`, (item) => item);
    const answerIndex = choices.indexOf(drug.brand);
    return makeQuestion({
      id: `med-brand-${drug.id}`,
      domain: PTCB_DOMAINS.medications.id,
      topic: "Brand / generic recall",
      prompt: `Which brand name matches the generic medication ${drug.generic}?`,
      choices,
      answerIndex,
      objective: "1.1 Generic names, brand names, and classifications of medications",
      tags: [drug.generic, drug.brand, drug.drugClass],
      explanation: `${drug.brand} is the brand name for ${drug.generic}, a ${drug.drugClass.toLowerCase()} used for ${drug.indication}.`,
      incorrectExplanations: choices.map((choice) =>
        choice === drug.brand
          ? ""
          : `${choice} is a real medication brand, but it does not correspond to ${drug.generic}.`,
      ),
    });
  });
}

function buildClassQuestions() {
  return medicationDrugs.slice(20, 100).map((drug) => {
    const distractors = pickDistractors(classPool, drug.drugClass, 3, `${drug.id}:class`);
    const choices = sortBySeed([drug.drugClass, ...distractors], `${drug.id}:class-choices`, (item) => item);
    const answerIndex = choices.indexOf(drug.drugClass);
    return makeQuestion({
      id: `med-class-${drug.id}`,
      domain: PTCB_DOMAINS.medications.id,
      topic: "Drug classes",
      prompt: `What drug class does ${drug.generic} belong to?`,
      choices,
      answerIndex,
      objective: "1.1 Generic names, brand names, and classifications of medications",
      tags: [drug.generic, drug.drugClass],
      explanation: `${drug.generic} belongs to the ${drug.drugClass.toLowerCase()} class and is commonly used for ${drug.indication}.`,
      incorrectExplanations: choices.map((choice) =>
        choice === drug.drugClass
          ? ""
          : `${choice} is a real drug class, but ${drug.generic} is not part of that class.`,
      ),
    });
  });
}

function buildIndicationQuestions() {
  return medicationDrugs.slice(40, 120).map((drug) => {
    const distractors = pickDistractors(indicationPool, drug.indication, 3, `${drug.id}:indication`);
    const choices = sortBySeed(
      [drug.indication, ...distractors],
      `${drug.id}:indication-choices`,
      (item) => item,
    );
    const answerIndex = choices.indexOf(drug.indication);
    return makeQuestion({
      id: `med-indication-${drug.id}`,
      domain: PTCB_DOMAINS.medications.id,
      topic: "Indications",
      prompt: `Which use best matches ${drug.generic}?`,
      choices,
      answerIndex,
      objective: "1.6 Indications of medications",
      tags: [drug.generic, drug.indication],
      explanation: `${drug.generic} is used for ${drug.indication}. It is a ${drug.drugClass.toLowerCase()}.`,
      incorrectExplanations: choices.map((choice) =>
        choice === drug.indication
          ? ""
          : `${choice} is an indication seen on the PTCE, but it is not the best match for ${drug.generic}.`,
      ),
    });
  });
}

function buildSideEffectQuestions() {
  const selectedDrugs = medicationDrugs.filter((drug) => HALLMARK_SIDE_EFFECT_IDS.includes(drug.id));

  return selectedDrugs.map((drug) => {
    const distractors = pickDistractors(sideEffectPool, drug.sideEffect, 3, `${drug.id}:side-effect`);
    const choices = sortBySeed(
      [drug.sideEffect, ...distractors],
      `${drug.id}:side-effect-choices`,
      (item) => item,
    );
    const answerIndex = choices.indexOf(drug.sideEffect);
    return makeQuestion({
      id: `med-side-effect-${drug.id}`,
      domain: PTCB_DOMAINS.medications.id,
      topic: "Adverse effects",
      prompt: `Which adverse effect or counseling point is most associated with ${drug.generic}?`,
      choices,
      answerIndex,
      objective: "1.5 Common or severe medication side effects, adverse effects, and allergies",
      tags: [drug.generic, drug.sideEffect],
      explanation: `${drug.generic} is especially associated with ${drug.sideEffect}. ${drug.pearl}`,
      incorrectExplanations: choices.map((choice) =>
        choice === drug.sideEffect
          ? ""
          : `${choice} can fit another medication, but it is not the hallmark concern most associated with ${drug.generic}.`,
      ),
    });
  });
}

function buildMedicationPearlQuestions() {
  const selectedDrugs = medicationDrugs.filter((drug) => SPECIAL_HANDLING_IDS.includes(drug.id));

  return selectedDrugs.map((drug) => {
    const correct = drug.pearl;
    const distractors = pickDistractors(
      selectedDrugs.map((item) => item.pearl),
      correct,
      3,
      `${drug.id}:pearl`,
    );
    const choices = sortBySeed([correct, ...distractors], `${drug.id}:pearl-choices`, (item) => item);
    const answerIndex = choices.indexOf(correct);
    return makeQuestion({
      id: `med-pearl-${drug.id}`,
      domain: PTCB_DOMAINS.medications.id,
      topic: "Storage and handling",
      prompt: `Which handling or storage instruction best fits ${drug.generic}?`,
      choices,
      answerIndex,
      objective: "1.4 Strengths/doses, dosage forms, routes of administration, special handling and administration instructions",
      tags: [drug.generic, "special-handling"],
      explanation: correct,
      incorrectExplanations: choices.map((choice) =>
        choice === correct
          ? ""
          : `That instruction belongs to a different high-yield medication, not ${drug.generic}.`,
      ),
    });
  });
}

function buildControlledScheduleQuestions() {
  const lookup = CONTROLLED_SUBSTANCE_QUICK_LOOKUP;
  const schedulePool = unique(lookup.map((item) => item.schedule));

  const askSchedule = lookup.map((item) => {
    const distractors = pickDistractors(schedulePool, item.schedule, 3, `${item.name}:schedule`);
    const choices = sortBySeed(
      [item.schedule, ...distractors],
      `${item.name}:schedule-choices`,
      (choice) => choice,
    );
    return makeQuestion({
      id: `federal-schedule-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      domain: PTCB_DOMAINS.federalRequirements.id,
      topic: "Controlled substance schedules",
      prompt: `What federal controlled substance schedule applies to ${item.name}?`,
      choices,
      answerIndex: choices.indexOf(item.schedule),
      objective: "2.2 Controlled substance prescriptions and DEA controlled substance schedules",
      tags: [item.name, item.schedule],
      explanation: `${item.name} is a ${item.schedule} controlled substance under federal law.`,
      incorrectExplanations: choices.map((choice) =>
        choice === item.schedule
          ? ""
          : `${choice} is a real schedule, but it is not the correct federal schedule for ${item.name}.`,
      ),
    });
  });

  return askSchedule;
}

const FEDERAL_QUESTIONS = [
  makeQuestion({
    id: "law-c2-refill",
    domain: PTCB_DOMAINS.federalRequirements.id,
    topic: "Controlled substance refills",
    prompt: "Which statement about Schedule II prescriptions is correct under federal law?",
    choices: [
      "Schedule II prescriptions cannot be refilled.",
      "Schedule II prescriptions may be refilled up to 5 times in 6 months.",
      "Schedule II prescriptions may always be transferred once between pharmacies.",
      "Schedule II prescriptions may be refilled if the prescriber documents an emergency.",
    ],
    answerIndex: 0,
    objective: "2.2 Controlled substance prescriptions and DEA controlled substance schedules",
    tags: ["controlled-substances", "refills"],
    explanation:
      "Schedule II prescriptions cannot be refilled under federal law. A new prescription is required for additional dispensing.",
    incorrectExplanations: [
      "",
      "Five refills in 6 months applies to many Schedule III and IV prescriptions, not Schedule II.",
      "Transfer rules are more limited and do not create refill authority for Schedule II prescriptions.",
      "Emergency situations can change how a prescription is communicated, but they do not create refill eligibility for Schedule II prescriptions.",
    ],
  }),
  makeQuestion({
    id: "law-c3-c4-refills",
    domain: PTCB_DOMAINS.federalRequirements.id,
    topic: "Controlled substance refills",
    prompt: "What is the federal refill limit for most Schedule III and IV controlled substances?",
    choices: [
      "Up to 5 refills within 6 months",
      "Unlimited refills for 12 months",
      "No refills are permitted",
      "One refill only within 30 days",
    ],
    answerIndex: 0,
    objective: "2.2 Controlled substance prescriptions and DEA controlled substance schedules",
    tags: ["controlled-substances", "refills"],
    explanation:
      "Schedule III and IV prescriptions may generally be refilled up to 5 times within 6 months from the date written, unless state law is stricter.",
    incorrectExplanations: [
      "",
      "Federal law does not allow unlimited refills for Schedule III or IV prescriptions.",
      "No-refill status applies to Schedule II prescriptions, not routine Schedule III and IV prescriptions.",
      "Federal law allows up to 5 refills in 6 months, not just one refill in 30 days.",
    ],
  }),
  makeQuestion({
    id: "law-pseudoephedrine-limit",
    domain: PTCB_DOMAINS.federalRequirements.id,
    topic: "Restricted drug programs",
    prompt: "Which purchase limit matches the federal Combat Methamphetamine Epidemic Act for pseudoephedrine products sold at retail?",
    choices: [
      "No more than 3.6 grams per day and 9 grams in 30 days",
      "No more than 1 gram per day and 5 grams in 30 days",
      "No more than 9 grams per day and 30 grams in 30 days",
      "No more than 2 grams per day and 6 grams in 30 days",
    ],
    answerIndex: 0,
    objective: "2.4 Federal restricted drug programs and related medication-processing requirements",
    tags: ["pseudoephedrine", "restricted-programs"],
    explanation:
      "Federal retail sales limits for pseudoephedrine products are 3.6 grams per day and 9 grams in 30 days.",
    incorrectExplanations: [
      "",
      "Those limits are lower than the federal retail limits and do not match the Combat Methamphetamine Epidemic Act.",
      "Those amounts are far above the retail federal limits for pseudoephedrine sales.",
      "Those numbers do not match the federal retail pseudoephedrine limits.",
    ],
  }),
  makeQuestion({
    id: "law-form-222",
    domain: PTCB_DOMAINS.federalRequirements.id,
    topic: "Controlled substance ordering",
    prompt: "Which DEA form is traditionally used for ordering Schedule II controlled substances when not using CSOS electronic ordering?",
    choices: ["DEA Form 222", "DEA Form 106", "DEA Form 41", "DEA Form 224"],
    answerIndex: 0,
    objective: "2.3 Receiving, storing, ordering, and destroying controlled substances",
    tags: ["dea-form-222", "controlled-ordering"],
    explanation:
      "DEA Form 222 is used for paper ordering of Schedule II controlled substances. CSOS is the electronic alternative.",
    incorrectExplanations: [
      "",
      "DEA Form 106 is used to report theft or significant loss of controlled substances.",
      "DEA Form 41 is used for documenting destruction of controlled substances.",
      "DEA Form 224 relates to registration, not routine ordering of Schedule II drugs.",
    ],
  }),
  makeQuestion({
    id: "law-form-106",
    domain: PTCB_DOMAINS.federalRequirements.id,
    topic: "Loss and theft",
    prompt: "A pharmacy discovers a significant loss of a controlled substance. Which DEA form documents the actual theft or loss?",
    choices: ["DEA Form 106", "DEA Form 222", "DEA Form 41", "DEA Form 363"],
    answerIndex: 0,
    objective: "2.3 Receiving, storing, ordering, and destroying controlled substances",
    tags: ["dea-form-106", "loss-theft"],
    explanation:
      "DEA Form 106 is used to document the actual circumstances and quantities involved in a theft or significant loss of controlled substances.",
    incorrectExplanations: [
      "",
      "DEA Form 222 is for ordering certain controlled substances, not reporting theft or loss.",
      "DEA Form 41 is associated with destruction, not documenting a theft or significant loss.",
      "DEA Form 363 relates to narcotic treatment program registration, not routine pharmacy loss reporting.",
    ],
  }),
  makeQuestion({
    id: "law-dscsa-quarantine",
    domain: PTCB_DOMAINS.federalRequirements.id,
    topic: "DSCSA",
    prompt: "Under DSCSA expectations, what should a pharmacy do first with a suspect product?",
    choices: [
      "Quarantine it from usable inventory and investigate",
      "Dispense it if the seal appears intact",
      "Return it to stock until the wholesaler calls back",
      "Mix it with other inventory so it is not accidentally targeted for theft",
    ],
    answerIndex: 0,
    objective: "2.6 FDA product serialization, tracking, tracing, handling, and quarantining requirements",
    tags: ["dscsa", "quarantine"],
    explanation:
      "A suspect product should be quarantined from usable inventory and investigated. It should not remain available for dispensing while its legitimacy is uncertain.",
    incorrectExplanations: [
      "",
      "Appearance alone is not enough. A suspect product must be separated and investigated.",
      "Returning a suspect product to normal stock increases the risk that it reaches a patient before investigation.",
      "Mixing suspect product with regular inventory makes traceability and quarantine harder, not safer.",
    ],
  }),
  makeQuestion({
    id: "law-recall-class-1",
    domain: PTCB_DOMAINS.federalRequirements.id,
    topic: "Recalls",
    prompt: "Which FDA recall class signals the greatest risk of serious adverse health consequences or death?",
    choices: ["Class I", "Class II", "Class III", "Market withdrawal"],
    answerIndex: 0,
    objective: "2.5 FDA requirements for medication recalls",
    tags: ["recalls"],
    explanation:
      "Class I recall is the most serious classification. It signals a reasonable probability of serious adverse health consequences or death.",
    incorrectExplanations: [
      "",
      "Class II recalls are less severe than Class I and usually involve temporary or medically reversible harm.",
      "Class III recalls are the least severe recall classification and are not likely to cause adverse health consequences.",
      "A market withdrawal is not the highest risk recall class and usually involves a minor issue.",
    ],
  }),
  makeQuestion({
    id: "law-rems",
    domain: PTCB_DOMAINS.federalRequirements.id,
    topic: "Restricted drug programs",
    prompt: "A medication can only be dispensed after specific enrollment and documentation steps required by the FDA. Which program is this?",
    choices: ["REMS", "NDC", "OBRA-90", "Tall Man lettering"],
    answerIndex: 0,
    objective: "2.4 Federal restricted drug programs and related medication-processing requirements",
    tags: ["rems"],
    explanation:
      "REMS, or Risk Evaluation and Mitigation Strategy, is the FDA program used for certain medications that require extra safety controls before dispensing.",
    incorrectExplanations: [
      "",
      "NDC identifies a drug product but does not create restricted-dispensing enrollment requirements.",
      "OBRA-90 is associated with counseling and utilization review requirements, not restricted drug dispensing enrollment programs.",
      "Tall Man lettering is an error-prevention strategy, not a federal restricted-drug program.",
    ],
  }),
  makeQuestion({
    id: "law-hazardous-storage",
    domain: PTCB_DOMAINS.federalRequirements.id,
    topic: "Hazardous substances",
    prompt: "Which statement best matches federal expectations for hazardous medication waste?",
    choices: [
      "It must be handled and disposed of according to hazardous-waste requirements instead of regular trash.",
      "It may be discarded in standard office trash if the container is sealed.",
      "It should be poured into a sink with running water.",
      "It can be mixed into general pharmacy trash as long as patient identifiers are removed.",
    ],
    answerIndex: 0,
    objective: "2.1 Storage, handling, and disposal of hazardous and pharmacological substances",
    tags: ["hazardous-waste"],
    explanation:
      "Hazardous medication waste requires proper hazardous-waste handling and disposal procedures rather than routine trash disposal.",
    incorrectExplanations: [
      "",
      "Sealed packaging does not make hazardous drug waste safe for normal office trash.",
      "Pouring hazardous medications into a sink is not an appropriate disposal method.",
      "Removing patient identifiers does not change hazardous-waste disposal rules.",
    ],
  }),
  makeQuestion({
    id: "law-med-guide",
    domain: PTCB_DOMAINS.federalRequirements.id,
    topic: "Medication guides",
    prompt: "Which document is FDA-required for certain products because it contains important patient safety information that must accompany the medication?",
    choices: ["Medication Guide", "DEA Form 222", "NDC labeler code", "VAERS report"],
    answerIndex: 0,
    objective: "2.5 FDA requirements for medication recalls",
    tags: ["medication-guide"],
    explanation:
      "Medication Guides are FDA-required patient handouts for certain drugs when serious safety information needs to be communicated each time the drug is dispensed.",
    incorrectExplanations: [
      "",
      "DEA Form 222 is an ordering document, not a patient safety handout.",
      "An NDC labeler code helps identify a product but is not the patient handout required to accompany certain medications.",
      "VAERS is a vaccine safety reporting system, not a patient handout.",
    ],
  }),
  makeQuestion({
    id: "law-controlled-destruction",
    domain: PTCB_DOMAINS.federalRequirements.id,
    topic: "Controlled substance destruction",
    prompt: "What is the best general federal principle for destruction of controlled substances in a pharmacy?",
    choices: [
      "Use the required documented destruction process instead of discarding the drug in regular trash.",
      "Place the controlled substance in the regular sharps container.",
      "Flush all expired controlled substances immediately.",
      "Return all controlled substances to will-call until an auditor arrives.",
    ],
    answerIndex: 0,
    objective: "2.3 Receiving, storing, ordering, and destroying controlled substances",
    tags: ["controlled-destruction"],
    explanation:
      "Controlled substances require proper documented destruction or reverse-distribution procedures rather than casual disposal.",
    incorrectExplanations: [
      "",
      "Sharps containers are not a universal destruction pathway for controlled substances.",
      "Flushing is not the general pharmacy destruction rule for expired controlled substances.",
      "Will-call storage does not resolve destruction or return requirements for expired controlled substances.",
    ],
  }),
  makeQuestion({
    id: "law-serialized-product",
    domain: PTCB_DOMAINS.federalRequirements.id,
    topic: "DSCSA",
    prompt: "Which identifier helps pharmacies trace a product through the supply chain under DSCSA?",
    choices: ["Serialized product identifier", "Tall Man lettering", "NCPDP ID", "SIG code"],
    answerIndex: 0,
    objective: "2.6 FDA product serialization, tracking, tracing, handling, and quarantining requirements",
    tags: ["dscsa", "serialization"],
    explanation:
      "DSCSA focuses on product tracing and serialization, so a serialized product identifier supports supply-chain verification and investigation.",
    incorrectExplanations: [
      "",
      "Tall Man lettering prevents name confusion but does not trace a product through the supply chain.",
      "NCPDP IDs identify pharmacies and billing entities, not individual serialized products for DSCSA tracing.",
      "SIG codes describe directions for use, not supply-chain traceability.",
    ],
  }),
];

const SAFETY_QUESTIONS = [
  makeQuestion({
    id: "safety-high-alert",
    domain: PTCB_DOMAINS.patientSafety.id,
    topic: "High-alert medications",
    prompt: "Which medication is commonly considered high-alert because an error could cause serious patient harm?",
    choices: ["Insulin", "Loratadine", "Docusate", "Clotrimazole cream"],
    answerIndex: 0,
    objective: "3.1 High-alert/risk medications and LASA medications",
    tags: ["high-alert", "insulin"],
    explanation:
      "Insulin is a classic high-alert medication because dosing errors can quickly cause severe hypoglycemia or hyperglycemia.",
    incorrectExplanations: [
      "",
      "Loratadine is not commonly classified as a high-alert medication.",
      "Docusate is not a high-alert medication.",
      "Clotrimazole cream is not a classic high-alert medication.",
    ],
  }),
  makeQuestion({
    id: "safety-tall-man",
    domain: PTCB_DOMAINS.patientSafety.id,
    topic: "Error prevention",
    prompt: "What is the primary purpose of Tall Man lettering such as hydrOXYzine versus hydrALAZINE?",
    choices: [
      "To reduce look-alike and sound-alike medication mix-ups",
      "To identify controlled substances",
      "To mark products that require refrigeration",
      "To show which drugs are over-the-counter",
    ],
    answerIndex: 0,
    objective: "3.2 Error prevention strategies",
    tags: ["tall-man", "lasa"],
    explanation:
      "Tall Man lettering visually highlights differences between look-alike or sound-alike names to reduce selection and dispensing errors.",
    incorrectExplanations: [
      "",
      "Tall Man lettering is unrelated to controlled-substance scheduling.",
      "Tall Man lettering does not indicate refrigeration requirements.",
      "Tall Man lettering does not distinguish prescription products from over-the-counter products.",
    ],
  }),
  makeQuestion({
    id: "safety-leading-zero",
    domain: PTCB_DOMAINS.patientSafety.id,
    topic: "Error prevention",
    prompt: "Which notation follows best practice for decimal safety?",
    choices: ["0.5 mg", ".5 mg", "5.0 mg", "5 mg.0"],
    answerIndex: 0,
    objective: "3.2 Error prevention strategies",
    tags: ["decimal-safety"],
    explanation:
      "A leading zero should be used for values less than one, so 0.5 mg is safest. Trailing zeros should be avoided.",
    incorrectExplanations: [
      "",
      "A missing leading zero can be misread and is considered unsafe notation.",
      "A trailing zero can be misread and is considered unsafe notation when it is unnecessary.",
      "This notation is not standard or safe for medication orders.",
    ],
  }),
  makeQuestion({
    id: "safety-pharmacist-intervention-allergy",
    domain: PTCB_DOMAINS.patientSafety.id,
    topic: "Pharmacist intervention",
    prompt: "Which situation should be escalated to the pharmacist before processing continues?",
    choices: [
      "The patient profile lists a severe penicillin allergy, but the prescription is for amoxicillin.",
      "The patient is paying cash instead of using insurance.",
      "The patient asks for a receipt.",
      "The bottle cap is child-resistant as expected.",
    ],
    answerIndex: 0,
    objective: "3.3 Issues that require pharmacist intervention",
    tags: ["allergy", "pharmacist-intervention"],
    explanation:
      "A severe allergy conflict requires pharmacist review before the prescription can be safely processed.",
    incorrectExplanations: [
      "",
      "Payment method alone is not a pharmacist-intervention issue.",
      "A request for a receipt does not create a clinical safety issue.",
      "A standard child-resistant cap is not a clinical reason to stop processing.",
    ],
  }),
  makeQuestion({
    id: "safety-pharmacist-intervention-duplicate",
    domain: PTCB_DOMAINS.patientSafety.id,
    topic: "Pharmacist intervention",
    prompt: "Which order-entry finding most clearly suggests therapeutic duplication that needs pharmacist review?",
    choices: [
      "A patient already takes lisinopril and now also has a new prescription for losartan from another clinic",
      "A patient receives cetirizine and an OTC saline nasal spray",
      "A patient receives polyethylene glycol and docusate",
      "A patient buys acetaminophen and tissues",
    ],
    answerIndex: 0,
    objective: "3.3 Issues that require pharmacist intervention",
    tags: ["therapeutic-duplication", "pharmacist-intervention"],
    explanation:
      "Using lisinopril and losartan together raises a duplication and safety concern that requires pharmacist review.",
    incorrectExplanations: [
      "",
      "Cetirizine and saline spray are not a major therapeutic duplication concern.",
      "These agents may both address constipation but do not represent the stronger duplication red flag shown in the correct option.",
      "Acetaminophen and tissues do not represent therapeutic duplication.",
    ],
  }),
  makeQuestion({
    id: "safety-medwatch",
    domain: PTCB_DOMAINS.patientSafety.id,
    topic: "Event reporting",
    prompt: "Which reporting pathway is used for serious adverse events involving many FDA-regulated medications and products other than vaccines?",
    choices: ["MedWatch", "VAERS", "DEA Form 222", "NDC directory"],
    answerIndex: 0,
    objective: "3.4 Event reporting procedures",
    tags: ["medwatch", "event-reporting"],
    explanation:
      "MedWatch is FDA’s safety information and adverse event reporting program for many FDA-regulated medical products other than vaccines.",
    incorrectExplanations: [
      "",
      "VAERS is specifically the vaccine adverse event reporting system.",
      "DEA Form 222 is an ordering form, not an adverse event reporting pathway.",
      "The NDC directory identifies products but does not collect adverse event reports.",
    ],
  }),
  makeQuestion({
    id: "safety-vaers",
    domain: PTCB_DOMAINS.patientSafety.id,
    topic: "Event reporting",
    prompt: "A patient experiences a serious problem after vaccination. Which reporting system is designed for this kind of event?",
    choices: ["VAERS", "MedWatch", "DSCSA", "REMS"],
    answerIndex: 0,
    objective: "3.4 Event reporting procedures",
    tags: ["vaers", "event-reporting"],
    explanation:
      "VAERS is the Vaccine Adverse Event Reporting System and is used for adverse events after vaccination.",
    incorrectExplanations: [
      "",
      "MedWatch covers many FDA-regulated products, but vaccine event questions usually point to VAERS specifically.",
      "DSCSA is about supply-chain tracing, not adverse event reporting.",
      "REMS is a restricted-safety program, not an adverse event reporting database.",
    ],
  }),
  makeQuestion({
    id: "safety-near-miss",
    domain: PTCB_DOMAINS.patientSafety.id,
    topic: "Quality improvement",
    prompt: "A technician catches the wrong stock bottle before a medication reaches the patient. How should this event be described?",
    choices: ["Near miss", "Completed adverse event", "Patient adherence problem", "Automatic substitution"],
    answerIndex: 0,
    objective: "3.4 Event reporting procedures",
    tags: ["near-miss", "quality-improvement"],
    explanation:
      "Because the error was caught before reaching the patient, it is a near miss and still useful for quality-improvement review.",
    incorrectExplanations: [
      "",
      "A completed adverse event generally implies the patient was exposed to the error.",
      "An adherence problem refers to how the patient takes the medication, not a dispensing error caught in-house.",
      "Automatic substitution does not describe an intercepted dispensing error.",
    ],
  }),
  makeQuestion({
    id: "safety-ppe",
    domain: PTCB_DOMAINS.patientSafety.id,
    topic: "Infection prevention",
    prompt: "Which action best supports infection prevention when handling medications and equipment in the pharmacy?",
    choices: [
      "Perform hand hygiene and use appropriate PPE for the task",
      "Skip handwashing if gloves are available",
      "Clean counting trays only when visibly dirty",
      "Reuse single-use gloves until the queue slows down",
    ],
    answerIndex: 0,
    objective: "3.6 Infection prevention procedures and cleaning standards",
    tags: ["infection-prevention", "ppe"],
    explanation:
      "Hand hygiene plus task-appropriate PPE is the core infection-prevention approach for medication handling and pharmacy workflow.",
    incorrectExplanations: [
      "",
      "Gloves do not replace hand hygiene.",
      "Cleaning should follow standards and workflow needs, not only visible dirt.",
      "Single-use gloves should not be reused.",
    ],
  }),
  makeQuestion({
    id: "safety-error-type",
    domain: PTCB_DOMAINS.patientSafety.id,
    topic: "Prescription errors",
    prompt: "A label prints directions for 1 tablet once daily, but the original prescription clearly says 1 tablet twice daily. What type of error is this?",
    choices: ["Incorrect dose or frequency transcription error", "Controlled substance diversion", "Temperature excursion", "DSCSA tracing error"],
    answerIndex: 0,
    objective: "3.5 Types of prescription errors",
    tags: ["transcription-error"],
    explanation:
      "Changing the intended daily amount on the label is a dosing or frequency transcription error and should be corrected before dispensing.",
    incorrectExplanations: [
      "",
      "There is no evidence of diversion in this example.",
      "A temperature excursion involves storage conditions, not label directions.",
      "DSCSA tracing errors involve supply-chain documentation, not label directions.",
    ],
  }),
  makeQuestion({
    id: "safety-lasa-storage",
    domain: PTCB_DOMAINS.patientSafety.id,
    topic: "LASA prevention",
    prompt: "Which storage strategy best helps prevent look-alike / sound-alike selection errors?",
    choices: [
      "Separate confusing products and use Tall Man lettering or shelf alerts",
      "Store them next to each other to speed selection",
      "Remove auxiliary labels so the shelves look cleaner",
      "Keep both products in unmarked bins",
    ],
    answerIndex: 0,
    objective: "3.2 Error prevention strategies",
    tags: ["lasa", "inventory-safety"],
    explanation:
      "Separating LASA products and using visual cues such as Tall Man lettering or alerts reduces selection mistakes.",
    incorrectExplanations: [
      "",
      "Putting LASA products next to each other raises the risk of picking the wrong one.",
      "Auxiliary labels and alerts are helpful safety cues, not clutter.",
      "Unmarked bins remove the visual safeguards that help prevent mix-ups.",
    ],
  }),
  makeQuestion({
    id: "safety-barcode",
    domain: PTCB_DOMAINS.patientSafety.id,
    topic: "Error prevention",
    prompt: "What is one major safety advantage of barcode use in medication workflows?",
    choices: [
      "It helps verify the right product for the right patient or order",
      "It eliminates the need for pharmacist verification",
      "It automatically approves all prior authorizations",
      "It makes Tall Man lettering unnecessary",
    ],
    answerIndex: 0,
    objective: "3.2 Error prevention strategies",
    tags: ["barcode-safety"],
    explanation:
      "Barcode technology helps verify products and can reduce wrong-patient or wrong-product errors, but it does not replace all human checks.",
    incorrectExplanations: [
      "",
      "Barcode systems support safety but do not eliminate pharmacist verification.",
      "Prior authorization is an insurance issue, not something barcodes automatically approve.",
      "Barcode checks and Tall Man lettering solve different safety problems and can be used together.",
    ],
  }),
  makeQuestion({
    id: "safety-unsafe-abbreviation",
    domain: PTCB_DOMAINS.patientSafety.id,
    topic: "Error prevention",
    prompt: "Which abbreviation is considered unsafe and should be clarified or avoided because it can be misread?",
    choices: ["U for units", "PO", "BID", "PRN"],
    answerIndex: 0,
    objective: "3.2 Error prevention strategies",
    tags: ["unsafe-abbreviations"],
    explanation:
      "U for units is unsafe because it can be mistaken for a zero or another character. Safer practice is to write out units.",
    incorrectExplanations: [
      "",
      "PO is a common route abbreviation meaning by mouth.",
      "BID is a common frequency abbreviation meaning twice daily.",
      "PRN is a common abbreviation meaning as needed.",
    ],
  }),
  makeQuestion({
    id: "safety-cleaning-tray",
    domain: PTCB_DOMAINS.patientSafety.id,
    topic: "Infection prevention",
    prompt: "Why should counting trays and spatulas be cleaned regularly between certain products?",
    choices: [
      "To reduce cross-contamination and mix-up risk",
      "To improve insurance claim acceptance",
      "To speed DEA audits",
      "To convert non-controlled prescriptions into transfers",
    ],
    answerIndex: 0,
    objective: "3.6 Infection prevention procedures and cleaning standards",
    tags: ["cross-contamination"],
    explanation:
      "Regular cleaning reduces cross-contamination and lowers the risk that residue from one product contaminates another medication.",
    incorrectExplanations: [
      "",
      "Cleaning trays does not directly affect claim adjudication.",
      "DEA audits focus on controlled-substance compliance, not tray cleaning speed.",
      "Cleaning equipment has nothing to do with prescription transfer status.",
    ],
  }),
  makeQuestion({
    id: "safety-right-patient",
    domain: PTCB_DOMAINS.patientSafety.id,
    topic: "Error prevention",
    prompt: "Which action best supports the 'right patient' part of medication safety before dispensing?",
    choices: [
      "Verify at least two patient identifiers such as name and date of birth",
      "Use the oldest stock bottle first",
      "Print the leaflet before counting tablets",
      "Remove auxiliary labels to reduce clutter",
    ],
    answerIndex: 0,
    objective: "3.2 Error prevention strategies",
    tags: ["right-patient", "error-prevention"],
    explanation:
      "Using at least two patient identifiers helps confirm the medication is being prepared for the correct patient and reduces wrong-patient errors.",
    incorrectExplanations: [
      "",
      "Using the oldest stock bottle first is inventory rotation, not patient-identification safety.",
      "Printing the leaflet does not verify patient identity.",
      "Removing labels can actually remove useful safety information.",
    ],
  }),
  makeQuestion({
    id: "safety-otc-escalation",
    domain: PTCB_DOMAINS.patientSafety.id,
    topic: "Pharmacist intervention",
    prompt: "Which scenario most clearly requires pharmacist intervention rather than technician-only assistance?",
    choices: [
      "A patient asks which OTC cough product is safest while taking warfarin and having high blood pressure",
      "A patient asks where the greeting cards are located",
      "A patient requests a printed medication list",
      "A patient wants a copy of the receipt for FSA paperwork",
    ],
    answerIndex: 0,
    objective: "3.3 Issues that require pharmacist intervention",
    tags: ["pharmacist-intervention", "otc-recommendation"],
    explanation:
      "OTC product selection for a patient with drug-therapy risks requires pharmacist judgment. Technicians should escalate the clinical recommendation.",
    incorrectExplanations: [
      "",
      "Store-location questions do not require pharmacist intervention.",
      "Printing a medication list is administrative support, not a clinical decision.",
      "Receipt requests do not require pharmacist clinical review.",
    ],
  }),
  makeQuestion({
    id: "safety-rca-purpose",
    domain: PTCB_DOMAINS.patientSafety.id,
    topic: "Quality improvement",
    prompt: "What is the main purpose of a root-cause analysis after a medication-use error or near miss?",
    choices: [
      "To identify system contributors and prevent the problem from happening again",
      "To assign blame to the first person who touched the prescription",
      "To erase the record after the discussion ends",
      "To convert the event into a controlled-substance audit",
    ],
    answerIndex: 0,
    objective: "3.4 Event reporting procedures",
    tags: ["root-cause-analysis", "quality-improvement"],
    explanation:
      "Root-cause analysis looks for system-level contributors so the workflow can be improved and repeat errors can be prevented.",
    incorrectExplanations: [
      "",
      "Root-cause analysis is meant to improve systems, not just blame one person.",
      "Events should be documented and used for learning, not erased.",
      "Medication error review is not automatically a controlled-substance audit.",
    ],
  }),
  makeQuestion({
    id: "safety-high-alert-double-check",
    domain: PTCB_DOMAINS.patientSafety.id,
    topic: "High-alert medications",
    prompt: "Which safety practice is especially important when processing high-alert medications such as insulin, anticoagulants, and opioids?",
    choices: [
      "Use an independent double-check or equivalent verification step when workflow allows",
      "Skip barcode scanning to save time",
      "Store them without warning labels so they are not singled out",
      "Always place them in will-call before final verification",
    ],
    answerIndex: 0,
    objective: "3.1 High-alert/risk medications and LASA medications",
    tags: ["high-alert", "double-check"],
    explanation:
      "Because high-alert medications can cause severe harm if used incorrectly, an independent double-check or similar verification step is an important risk-reduction strategy.",
    incorrectExplanations: [
      "",
      "High-alert workflows should add safeguards, not skip them.",
      "Removing warnings weakens safety signals instead of improving them.",
      "Will-call storage does not replace verification before dispensing.",
    ],
  }),
];

const ORDER_ENTRY_QUESTIONS = [
  makeQuestion({
    id: "order-days-supply-60-bid",
    domain: PTCB_DOMAINS.orderEntry.id,
    topic: "Days supply",
    prompt: "A prescription is written for lisinopril 10 mg, take 1 tablet by mouth twice daily, quantity 60 tablets. What is the days supply?",
    choices: ["30 days", "15 days", "45 days", "60 days"],
    answerIndex: 0,
    objective: "4.1 Formulas, calculations, conversions, and Sig codes",
    tags: ["days-supply", "math"],
    explanation:
      "At 2 tablets per day, 60 tablets lasts 30 days. Days supply = quantity divided by daily use.",
    incorrectExplanations: [
      "",
      "15 days would be correct only if the patient used 4 tablets per day.",
      "45 days does not match 60 tablets at 2 tablets daily.",
      "60 days would be correct only if the patient took 1 tablet daily.",
    ],
  }),
  makeQuestion({
    id: "order-liquid-150ml",
    domain: PTCB_DOMAINS.orderEntry.id,
    topic: "Liquid quantity calculation",
    prompt: "Amoxicillin suspension directions read: take 5 mL by mouth three times daily for 10 days. How much volume is needed to complete therapy?",
    choices: ["150 mL", "50 mL", "100 mL", "200 mL"],
    answerIndex: 0,
    objective: "4.1 Formulas, calculations, conversions, and Sig codes",
    tags: ["math", "liquid"],
    explanation:
      "5 mL x 3 doses per day x 10 days = 150 mL total.",
    incorrectExplanations: [
      "",
      "50 mL would cover only part of the treatment course.",
      "100 mL underestimates the needed total volume.",
      "200 mL is more than required for this regimen.",
    ],
  }),
  makeQuestion({
    id: "order-inhaler-days-supply",
    domain: PTCB_DOMAINS.orderEntry.id,
    topic: "Days supply",
    prompt: "An inhaler contains 200 actuations. Directions are 2 puffs four times daily. What is the days supply?",
    choices: ["25 days", "50 days", "12 days", "100 days"],
    answerIndex: 0,
    objective: "4.1 Formulas, calculations, conversions, and Sig codes",
    tags: ["days-supply", "math"],
    explanation:
      "The patient uses 8 actuations per day. 200 actuations divided by 8 actuations daily equals 25 days.",
    incorrectExplanations: [
      "",
      "50 days would be correct only if the inhaler were used 4 puffs daily.",
      "12 days is too short for 200 actuations at this rate.",
      "100 days is far too long for 8 actuations per day.",
    ],
  }),
  makeQuestion({
    id: "order-insulin-vial",
    domain: PTCB_DOMAINS.orderEntry.id,
    topic: "Insulin calculations",
    prompt: "A U-100 insulin vial contains 10 mL. If a patient injects 20 units every night, about how many days will one vial last?",
    choices: ["50 days", "10 days", "20 days", "100 days"],
    answerIndex: 0,
    objective: "4.1 Formulas, calculations, conversions, and Sig codes",
    tags: ["insulin", "math"],
    explanation:
      "A U-100 vial has 100 units per mL. Ten mL gives 1,000 units total, and 1,000 units divided by 20 units daily equals 50 days.",
    incorrectExplanations: [
      "",
      "10 days would require the patient to use 100 units daily.",
      "20 days would require the patient to use 50 units daily.",
      "100 days would require the patient to use only 10 units daily.",
    ],
  }),
  makeQuestion({
    id: "order-sig-bid",
    domain: PTCB_DOMAINS.orderEntry.id,
    topic: "Sig codes",
    prompt: "What does BID mean on a prescription label?",
    choices: ["Twice daily", "At bedtime", "As needed", "Every 4 hours"],
    answerIndex: 0,
    objective: "4.1 Formulas, calculations, conversions, and Sig codes",
    tags: ["sig-codes"],
    explanation:
      "BID stands for twice daily.",
    incorrectExplanations: [
      "",
      "At bedtime is QHS.",
      "As needed is PRN.",
      "Every 4 hours is Q4H.",
    ],
  }),
  makeQuestion({
    id: "order-sig-prn",
    domain: PTCB_DOMAINS.orderEntry.id,
    topic: "Sig codes",
    prompt: "What does PRN mean?",
    choices: ["As needed", "By mouth", "Every morning", "Four times daily"],
    answerIndex: 0,
    objective: "4.1 Formulas, calculations, conversions, and Sig codes",
    tags: ["sig-codes"],
    explanation:
      "PRN means as needed.",
    incorrectExplanations: [
      "",
      "By mouth is PO.",
      "Every morning is QAM.",
      "Four times daily is QID.",
    ],
  }),
  makeQuestion({
    id: "order-sig-sl",
    domain: PTCB_DOMAINS.orderEntry.id,
    topic: "Sig codes",
    prompt: "What does SL mean?",
    choices: ["Sublingual", "Subcutaneous", "Left ear", "With food"],
    answerIndex: 0,
    objective: "4.1 Formulas, calculations, conversions, and Sig codes",
    tags: ["sig-codes"],
    explanation:
      "SL means sublingual, or under the tongue.",
    incorrectExplanations: [
      "",
      "Subcutaneous is typically written SQ or SubQ.",
      "Left ear is AS.",
      "With food is not written SL.",
    ],
  }),
  makeQuestion({
    id: "order-oral-syringe",
    domain: PTCB_DOMAINS.orderEntry.id,
    topic: "Supplies and equipment",
    prompt: "Which measuring device is best for accurately giving a child 3 mL of liquid medication by mouth?",
    choices: ["Oral syringe", "Teaspoon from the kitchen", "Large paper medicine cup", "Hypodermic needle"],
    answerIndex: 0,
    objective: "4.2 Equipment and supplies required for drug administration",
    tags: ["supplies", "oral-syringe"],
    explanation:
      "An oral syringe provides the best accuracy for a small oral liquid dose such as 3 mL.",
    incorrectExplanations: [
      "",
      "Kitchen spoons are inaccurate and should not be used for precise medication measurement.",
      "A large medicine cup is less accurate than an oral syringe for small volumes.",
      "A hypodermic needle is not appropriate for administering an oral liquid dose.",
    ],
  }),
  makeQuestion({
    id: "order-insulin-syringe",
    domain: PTCB_DOMAINS.orderEntry.id,
    topic: "Supplies and equipment",
    prompt: "Which device is designed specifically for measuring and administering U-100 insulin doses?",
    choices: ["U-100 insulin syringe", "Oral syringe", "Nebulizer cup", "Spacer device"],
    answerIndex: 0,
    objective: "4.2 Equipment and supplies required for drug administration",
    tags: ["supplies", "insulin"],
    explanation:
      "A U-100 insulin syringe is calibrated specifically for U-100 insulin and supports accurate dosing.",
    incorrectExplanations: [
      "",
      "An oral syringe is for liquid medications taken by mouth, not insulin injection.",
      "A nebulizer cup is used for inhalation treatments, not insulin injection.",
      "A spacer is used with certain inhalers, not insulin.",
    ],
  }),
  makeQuestion({
    id: "order-spacer",
    domain: PTCB_DOMAINS.orderEntry.id,
    topic: "Supplies and equipment",
    prompt: "Which accessory can improve delivery from a metered-dose inhaler for many patients?",
    choices: ["Spacer", "Sharps container", "Medicine spoon", "Catheter tip syringe"],
    answerIndex: 0,
    objective: "4.2 Equipment and supplies required for drug administration",
    tags: ["supplies", "inhaler"],
    explanation:
      "A spacer helps many patients coordinate inhaler use and improves medication delivery from a metered-dose inhaler.",
    incorrectExplanations: [
      "",
      "A sharps container is for disposal of sharp objects, not inhaler administration.",
      "A medicine spoon is for oral liquids, not inhaler technique.",
      "A catheter tip syringe is not the standard inhaler accessory described here.",
    ],
  }),
  makeQuestion({
    id: "order-ndc",
    domain: PTCB_DOMAINS.orderEntry.id,
    topic: "NDC and identifiers",
    prompt: "What does an NDC number identify?",
    choices: [
      "The drug product, including labeler and package presentation",
      "The patient who will receive the medication",
      "The lot-specific shipment date only",
      "The pharmacy technician who filled the prescription",
    ],
    answerIndex: 0,
    objective: "4.3 Lot numbers, expiration dates, and NDC numbers",
    tags: ["ndc"],
    explanation:
      "The National Drug Code identifies the drug product and package information rather than the patient or the person filling the prescription.",
    incorrectExplanations: [
      "",
      "Patient identity is tracked through the prescription and profile, not the NDC.",
      "Lot number and expiration data are separate from the NDC.",
      "The NDC does not identify the staff member who filled the prescription.",
    ],
  }),
  makeQuestion({
    id: "order-lot-number",
    domain: PTCB_DOMAINS.orderEntry.id,
    topic: "NDC and identifiers",
    prompt: "If a manufacturer announces that only one batch of a medication is affected by a defect, which identifier is most useful to isolate the affected stock?",
    choices: ["Lot number", "BIN number", "DEA number", "SIG code"],
    answerIndex: 0,
    objective: "4.3 Lot numbers, expiration dates, and NDC numbers",
    tags: ["lot-number"],
    explanation:
      "Lot numbers identify specific batches, so they are essential when isolating affected stock during a defect investigation or recall.",
    incorrectExplanations: [
      "",
      "A BIN number is related to pharmacy claims routing, not product batch identification.",
      "A DEA number identifies a registrant or prescriber, not a medication batch.",
      "A SIG code contains directions for use, not manufacturing-batch identity.",
    ],
  }),
  makeQuestion({
    id: "order-reverse-distribution",
    domain: PTCB_DOMAINS.orderEntry.id,
    topic: "Returns and expired products",
    prompt: "Which route is most appropriate for expired, non-dispensable stock that cannot simply be returned to active inventory?",
    choices: ["Reverse distribution or approved return process", "Put it back on the shelf", "Move it to will-call", "Dispense it with an auxiliary label"],
    answerIndex: 0,
    objective: "4.4 Procedures for identifying and returning dispensable, non-dispensable, and expired medications",
    tags: ["reverse-distribution", "returns"],
    explanation:
      "Expired or otherwise non-dispensable stock should be removed from usable inventory and handled through a reverse distributor or approved return process.",
    incorrectExplanations: [
      "",
      "Expired stock should never go back into active dispensing inventory.",
      "Will-call is for patient-specific ready prescriptions, not expired stock.",
      "An auxiliary label does not make expired stock safe to dispense.",
    ],
  }),
  makeQuestion({
    id: "order-ds-patch",
    domain: PTCB_DOMAINS.orderEntry.id,
    topic: "Days supply",
    prompt: "A transdermal patch is applied every 72 hours. If the prescription contains 10 patches, about how many days of therapy are supplied?",
    choices: ["30 days", "10 days", "20 days", "72 days"],
    answerIndex: 0,
    objective: "4.1 Formulas, calculations, conversions, and Sig codes",
    tags: ["days-supply", "math"],
    explanation:
      "Every 72 hours is every 3 days. Ten patches x 3 days per patch = 30 days.",
    incorrectExplanations: [
      "",
      "Ten days would be correct only if each patch lasted one day.",
      "Twenty days would require each patch to last two days instead of three.",
      "Seventy-two refers to hours per patch, not total days supplied.",
    ],
  }),
  makeQuestion({
    id: "order-q8h-quantity",
    domain: PTCB_DOMAINS.orderEntry.id,
    topic: "Quantity calculation",
    prompt: "How many capsules are needed for a 7-day supply if directions are take 1 capsule every 8 hours?",
    choices: ["21 capsules", "7 capsules", "14 capsules", "28 capsules"],
    answerIndex: 0,
    objective: "4.1 Formulas, calculations, conversions, and Sig codes",
    tags: ["math", "quantity"],
    explanation:
      "Every 8 hours equals 3 doses per day. Over 7 days, 3 x 7 = 21 capsules.",
    incorrectExplanations: [
      "",
      "7 capsules would cover only one capsule daily.",
      "14 capsules would cover two doses daily, not three.",
      "28 capsules would imply four doses daily for 7 days.",
    ],
  }),
];

function buildSigMeaningQuestions() {
  return SIG_CODES.slice(0, 12).map((sig) => {
    const distractors = pickDistractors(
      SIG_CODES.map((entry) => entry.meaning),
      sig.meaning,
      3,
      `${sig.term}:meaning`,
    );
    const choices = sortBySeed([sig.meaning, ...distractors], `${sig.term}:choices`, (item) => item);
    return makeQuestion({
      id: `sig-${sig.term.toLowerCase()}`,
      domain: PTCB_DOMAINS.orderEntry.id,
      topic: "Sig codes",
      prompt: `What does ${sig.term} mean?`,
      choices,
      answerIndex: choices.indexOf(sig.meaning),
      objective: "4.1 Formulas, calculations, conversions, and Sig codes",
      tags: ["sig-codes", sig.term],
      explanation: `${sig.term} means ${sig.meaning}. Example: ${sig.example}`,
      incorrectExplanations: choices.map((choice) =>
        choice === sig.meaning
          ? ""
          : `${choice} is a real dosing concept, but it is not the meaning of ${sig.term}.`,
      ),
    });
  });
}

function buildHighAlertQuestions() {
  const highAlerts = [
    { name: "insulin", distractors: ["loratadine", "docusate", "hydrocortisone cream"] },
    { name: "warfarin", distractors: ["cetirizine", "clotrimazole cream", "docusate"] },
    { name: "hydromorphone", distractors: ["polyethylene glycol 3350", "loratadine", "famotidine"] },
    { name: "enoxaparin", distractors: ["cetirizine", "omeprazole", "clotrimazole cream"] },
  ];

  return highAlerts.map((item) =>
    makeQuestion({
      id: `safety-high-alert-${item.name.replace(/[^a-z0-9]+/g, "-")}`,
      domain: PTCB_DOMAINS.patientSafety.id,
      topic: "High-alert medications",
      prompt: "Which medication in this list is the strongest example of a high-alert medication?",
      choices: sortBySeed([item.name, ...item.distractors], item.name, (choice) => choice),
      answerIndex: sortBySeed([item.name, ...item.distractors], item.name, (choice) => choice).indexOf(
        item.name,
      ),
      objective: "3.1 High-alert/risk medications and LASA medications",
      tags: ["high-alert", item.name],
      explanation: `${item.name} is considered high alert because an error can quickly cause serious patient harm.`,
      incorrectExplanations: sortBySeed([item.name, ...item.distractors], item.name, (choice) => choice).map(
        (choice) =>
          choice === item.name
            ? ""
            : `${choice} may still require care, but it is not the strongest high-alert example in this set.`,
      ),
    }),
  );
}

export function buildQuestionBank() {
  return [
    ...buildBrandQuestions(),
    ...buildClassQuestions(),
    ...buildIndicationQuestions(),
    ...buildSideEffectQuestions(),
    ...buildMedicationPearlQuestions(),
    ...buildControlledScheduleQuestions(),
    ...FEDERAL_QUESTIONS,
    ...SAFETY_QUESTIONS,
    ...ORDER_ENTRY_QUESTIONS,
    ...buildSigMeaningQuestions(),
    ...buildHighAlertQuestions(),
  ];
}

export function getQuestionBankByDomain(questionBank = buildQuestionBank()) {
  return questionBank.reduce((accumulator, question) => {
    accumulator[question.domain] ||= [];
    accumulator[question.domain].push(question);
    return accumulator;
  }, {});
}

export function buildExamSet(questionBank, plan, seedKey = "exam") {
  const grouped = getQuestionBankByDomain(questionBank);

  return Object.entries(plan).flatMap(([domain, count]) =>
    sortBySeed(grouped[domain] ?? [], `${seedKey}:${domain}`).slice(0, count),
  );
}

export function buildWeakTopicQuiz(questionBank, weakTags, count = 10) {
  const normalizedTags = weakTags.map((tag) => tag.toLowerCase());
  const filtered = questionBank.filter((question) =>
    question.tags.some((tag) => normalizedTags.includes(String(tag).toLowerCase())),
  );

  return sortBySeed(filtered, `weak-quiz:${weakTags.join("|")}`).slice(0, count);
}
