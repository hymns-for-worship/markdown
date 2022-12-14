import * as fs from "fs";

const api = "https://hfw-api-5aaupoorbq-uc.a.run.app/api";
const output = "./";

async function main() {
  const hymns = await fetch(`${api}/hymns`).then((r) => r.json());
  const hymnPortions = await fetch(`${api}/hymn-portions`).then((r) =>
    r.json()
  );
  const hymnScriptures = await fetch(`${api}/hymn-scriptures`).then((r) =>
    r.json()
  );
  const hymnTopics = await fetch(`${api}/hymn-topics`).then((r) => r.json());
  const topics = await fetch(`${api}/topics`).then((r) => r.json());
  const stakeholders = await fetch(`${api}/stakeholders`).then((r) => r.json());
  const stakeholderItems = await fetch(`${api}/hymn-stakeholders`).then((r) =>
    r.json()
  );

  const indexList = ["# Hymns for Worship", ""];
  indexList.push("");

  // Hymns
  const hymnsDir = getDir("hymns");
  indexList.push("## Hymns");
  for (const hymn of hymns) {
    const sb = [];
    sb.push(`# ${hymn.number} - ${hymn.title}`);
    indexList.push(
      `- [${hymn.number} - ${hymn.title}](/hymns/${hymn.number}.md)`
    );
    sb.push("");

    // Notation
    sb.push(`## Notation`);
    sb.push("");
    sb.push(
      `${hymn.key_signature} - ${hymn.time_signature} on ${hymn.starting_beat} - ${hymn.starting_pitch}`
    );
    sb.push("");

    // Hymn portions
    sb.push(`## Lyrics`);
    sb.push("");
    for (const portion of hymnPortions.filter((p) => p.hymn_id === hymn.id)) {
      sb.push(`### ${portion.portion}`);
      sb.push("");
      sb.push(portion.lyrics || "");
      sb.push("");
    }
    sb.push("");

    // Hymn scriptures
    sb.push(`## Scriptures`);
    sb.push("");
    for (const scripture of hymnScriptures.filter(
      (s) => s.hymn_id === hymn.id
    )) {
      const ref = scripture.reference || "";
      const prefix = "https://www.biblegateway.com/passage/?search=";
      // Encode the reference for the URL
      const encoded = encodeURIComponent(ref);
      sb.push(`- [${ref}](${prefix}${encoded})`);
    }
    sb.push("");

    // Topics
    sb.push(`## Topics`);
    sb.push("");
    for (const topic of hymnTopics.filter((t) => t.hymn_id === hymn.id)) {
      const t = topics.find((t) => t.id === topic.topic_id);
      sb.push(`- ${t.name}`);
    }
    sb.push("");

    // Stakeholders
    sb.push(`## Stakeholders`);
    sb.push("");
    for (const stakeholder of stakeholderItems.filter(
      (s) => s.hymn_id === hymn.id
    )) {
      const s = stakeholders.find((s) => s.id === stakeholder.stakeholder_id);
      sb.push(`- ${s.name} (${stakeholder.relationship})`);
    }
    sb.push("");

    // Copyright
    sb.push(`## Copyright`);
    sb.push("");
    sb.push(`${hymn.copyright_text}`);
    sb.push(`${hymn.copyright_status_text}`);
    sb.push("");

    // Disclaimers
    sb.push(`## Disclaimers`);
    sb.push("");
    for (const item of hymn.disclaimer) {
      sb.push(`${item}`);
    }
    sb.push("");

    // Write the file to disk
    sb.push("");
    const outFile = `${hymnsDir}/${hymn.number}.md`;
    const result = sb.join("\n");
    fs.writeFileSync(outFile, result);
  }
  indexList.push("");

  // Topics
  const topicsDir = getDir("topics");
  indexList.push("## Topics");
  for (const topic of topics) {
    const sb = [];
    sb.push(`# ${topic.name}`);
    indexList.push(`- [${topic.name}](/topics/${topic.alias}.md)`);
    sb.push("");

    // Hymns
    sb.push(`## Hymns`);
    sb.push("");
    for (const hymn of hymnTopics.filter((t) => t.topic_id === topic.id)) {
      const h = hymns.find((h) => h.id === hymn.hymn_id);
      if (h) {
        sb.push(`- [${h.number} - ${h.title}](/hymns/${h.number}.md)`);
      }
    }
    sb.push("");

    // Write the file to disk
    const outFile = `${topicsDir}/${topic.alias}.md`;
    const result = sb.join("\n");
    fs.writeFileSync(outFile, result);
  }

  // Stakeholders
  const stakeholdersDir = getDir("stakeholders");
  indexList.push("## Stakeholders");
  for (const stakeholder of stakeholders) {
    const sb = [];
    sb.push(`# ${stakeholder.name}`);
    indexList.push(
      `- [${stakeholder.name}](/stakeholders/${stakeholder.id}.md)`
    );
    sb.push("");

    // Group by relationship
    const groups = stakeholderItems
      .filter((s) => s.stakeholder_id === stakeholder.id)
      .reduce((acc, item) => {
        const group = acc[item.relationship] || [];
        group.push(item);
        acc[item.relationship] = group;
        return acc;
      }, {});

    // Hymns by relationship
    for (const relationship in groups) {
      sb.push(`## ${relationship}`);
      sb.push("");
      for (const item of groups[relationship]) {
        const h = hymns.find((h) => h.id === item.hymn_id);
        if (h) {
          sb.push(`- [${h.number} - ${h.title}](/hymns/${h.number}.md)`);
        }
      }
      sb.push("");
    }

    // Write the file to disk
    sb.push("");
    const outFile = `${stakeholdersDir}/${stakeholder.id}.md`;
    const result = sb.join("\n");
    fs.writeFileSync(outFile, result);
  }

  // Write the index file
  const indexFile = `${output}/README.md`;
  const index = indexList.join("\n");
  fs.writeFileSync(indexFile, index);
}

function getDir(dir) {
  const newDir = `${output}/${dir}`;
  if (!fs.existsSync(newDir)) {
    fs.mkdirSync(newDir);
  }
  return newDir;
}

main();
