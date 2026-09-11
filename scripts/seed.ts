/**
 * Seed 3DS Academy with a realistic 3DEXPERIENCE catalogue.
 *
 *   npm run db:seed
 *
 * Every lesson is pointed at a REAL public YouTube video about CATIA / SIMULIA / ENOVIA /
 * DELMIA so the player, progress tracking and certificates work out of the box. Some rows
 * deliberately use Google Drive links to show that the same player handles Drive embeds.
 */
import { credentialId, getDb, insert, newId, nowIso, run } from "../src/server/db";

/* ------------------------------------------------------------------ *
 * Real videos                                                        *
 * ------------------------------------------------------------------ */
const YT = {
  platformIntro: "https://www.youtube.com/watch?v=-hx1CXpqVDQ", // Introduction to the 3DEXPERIENCE platform
  swPlatform: "https://www.youtube.com/watch?v=32Uy-5avT_U", // SOLIDWORKS 3DEXPERIENCE platform overview
  catiaOverview: "https://www.youtube.com/watch?v=RT4z2-bxqe0", // CATIA V5 overview / tutorial 01
  catiaTips: "https://www.youtube.com/watch?v=-nuZzhnyuGM", // CATIA V5 tips & tricks
  catiaPartPlaylist: "https://www.youtube.com/playlist?list=PLrOFa8sDv6jdORmv7HQUYVZG3Lh1XC2tV",
  catiaBeginnerPlaylist: "https://www.youtube.com/playlist?list=PLWLGt1sWIIEvDaK2JotadjUkM2G6qwYEc",
  assembly: "https://www.youtube.com/watch?v=--PjsfDQgZE", // CATIA V5 Assembly Design
  assembly2: "https://www.youtube.com/watch?v=kNVtVIZDvMc", // Assembly design walkthrough
  kinematics: "https://www.youtube.com/watch?v=nU0HQr-ScvM", // Roller chain: part + assembly + DMU
  abaqusStart: "https://www.youtube.com/watch?v=zdR9mc39KWo", // Getting started with Abaqus
  abaqusBasic: "https://www.youtube.com/watch?v=SOiBbmGw02Q", // Abaqus #1 basic introduction
  abaqusFast: "https://www.youtube.com/watch?v=sM3oOtS_Fg4", // Abaqus in under 35 minutes
  enoviaConfig: "https://www.youtube.com/watch?v=uwDLGfm89kQ", // Configuration management with ENOVIA
  platformCustom: "https://www.youtube.com/watch?v=DAxzpw1la08", // Customising the 3DEXPERIENCE platform
  delmiaRobot: "https://www.youtube.com/watch?v=0QPRmOpCo3A", // DELMIA Robotics on 3DEXPERIENCE
  delmiaRobot2: "https://www.youtube.com/watch?v=fdxYjgVzjEc", // DELMIA robot + EOAT TCP
} as const;

/**
 * Hosted-file videos (not YouTube) so the native HTML5 player path is exercised too.
 * These are Google's public sample clips — swap them for your own recording links in /admin.
 */
const HOSTED = {
  labRecording: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  examWalkthrough: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
};
const DEMO_MEDIA_NOTE =
  "Placeholder media for this demo install: it streams from a public sample file so you can see the native player path. Replace it in /admin with your own YouTube or Google Drive link.";

type LessonSeed = { title: string; mins: number; preview?: boolean; video?: string; drive?: boolean; notes?: string };
type ModuleSeed = { title: string; summary: string; lessons: LessonSeed[] };
type CourseSeed = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  whatYouLearn: string[];
  requirements: string[];
  level: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  price: number;
  mrpPrice: number;
  featured?: boolean;
  tags: string[];
  trailer: string;
  instructor: number;
  pool: string[];
  modules: ModuleSeed[];
  resources: { title: string; url: string; kind: string; sizeText?: string }[];
  faqs: { q: string; a: string }[];
};

const USERS = [
  {
    email: "admin@3dsacademy.dev",
    name: "Dr. Ravi Kumar",
    role: "ADMIN",
    headline: "Dean, Digital Engineering · CATIA certified professional",
    bio: "18 years teaching CAD/CAE to mechanical students, 6 years as a Dassault Systèmes channel trainer.",
  },
  {
    email: "instructor@3dsacademy.dev",
    name: "Neha Sharma",
    role: "INSTRUCTOR",
    headline: "PLM Consultant · ENOVIA & 3DEXPERIENCE roles",
    bio: "Runs PLM roll-outs for auto-ancillary manufacturers and authors the ENOVIA track.",
  },
  {
    email: "vikram@3dsacademy.dev",
    name: "Vikram Iyer",
    role: "INSTRUCTOR",
    headline: "Structural simulation lead · SIMULIA Power Lab",
    bio: "Abaqus, Isight and reduced-order models day in, day out. Previously in an F1 simulation group.",
  },
  { email: "student@3dsacademy.dev", name: "Arjun Verma", role: "STUDENT", headline: "B.E. Mechanical, final year", bio: "" },
  { email: "priya@3dsacademy.dev", name: "Priya Nair", role: "STUDENT", headline: "Design engineer, aerospace start-up", bio: "" },
  { email: "sameer@3dsacademy.dev", name: "Sameer Khan", role: "STUDENT", headline: "Diploma student, tool room", bio: "" },
  { email: "ananya@3dsacademy.dev", name: "Ananya Rao", role: "STUDENT", headline: "M.Tech, manufacturing systems", bio: "" },
  { email: "rahul@3dsacademy.dev", name: "Rahul Deshpande", role: "STUDENT", headline: "Working in tool design, upskilling", bio: "" },
];

const COURSES: CourseSeed[] = [
  {
    slug: "3dexperience-platform-foundation",
    title: "3DEXPERIENCE Platform Foundation: Roles, 3DSpace & Collaboration",
    subtitle: "Sign in, set up roles, manage 3DSpace and never lose a revision again.",
    level: "Beginner",
    category: "Platform & Roles",
    price: 0,
    mrpPrice: 1999,
    featured: true,
    tags: ["3DEXPERIENCE", "3DSpace", "ENOVIA", "Beginner"],
    instructor: 0,
    trailer: YT.platformIntro,
    description: `This is the course I wish someone had handed me on day one: how the **3DEXPERIENCE®** platform actually fits together before you touch a single CAD command.

You will create a role-based working environment, understand the difference between the *cloud* and *on-premise* tenants, and learn how data is stored, versioned and shared through **3DSpace**. By the end you can onboard a whole class or a design office without raising a support ticket.

No prior Dassault Systèmes experience needed — only a laptop and a free 3DEXPERIENCE trial ID.`,
    whatYouLearn: [
      "Log in to a 3DEXPERIENCE tenant and install the platform launcher",
      "Understand Roles, Apps and Workbenches — why the platform is role-based",
      "Manage 3DSpace: folders, filters, revisions and save-as-version workflows",
      "Share, comment and review with 3DSwym communities",
      "Run 3DPlay and 3DCompose for lightweight reviews with non-CAD stakeholders",
      "Set up a college lab with controlled seats and licences",
    ],
    requirements: [
      "A free 3DEXPERIENCE trial account (we walk you through signing up)",
      "Windows 10/11 or macOS with a modern browser",
      "No CAD experience required",
    ],
    pool: [YT.platformIntro, YT.platformCustom, YT.swPlatform],
    modules: [
      {
        title: "Welcome & Platform Map",
        summary: "What 3DEXPERIENCE is, what it replaces, and how to get an account today.",
        lessons: [
          { title: "Course introduction & how to use this platform", mins: 9, preview: true, video: YT.platformIntro },
          { title: "Virtual twin experience: the 60-second story", mins: 12, video: YT.platformIntro },
          { title: "Getting your 3DEXPERIENCE trial ID", mins: 14, video: YT.platformCustom },
          { title: "Install the 3DEXPERIENCE launcher (Windows + macOS)", mins: 11, video: YT.platformCustom },
        ],
      },
      {
        title: "Roles, Apps & 3DSpace",
        summary: "The mental model that makes everything else obvious.",
        lessons: [
          { title: "Roles vs Apps vs Workbenches", mins: 16, video: YT.platformIntro },
          { title: "Navigating 3DSpace: folders, filters, search", mins: 21, video: YT.platformCustom },
          { title: "Save, version and revise — the right way", mins: 18, drive: true, video: YT.platformCustom },
          { title: "Sharing an object with your team", mins: 13, video: YT.platformIntro },
        ],
      },
      {
        title: "Collaboration & Review",
        summary: "3DSwym, 3DPlay, 3DCompose and marking up a model.",
        lessons: [
          { title: "3DSwym communities & posts", mins: 15, video: YT.platformIntro },
          { title: "Markup in 3DPlay: annotate a design in 4 minutes", mins: 17, video: YT.swPlatform },
          { title: "3DCompose for quick presentation videos", mins: 19, video: YT.swPlatform },
          { title: "Lab set-up for 60 students on shared seats", mins: 22, video: YT.platformCustom },
        ],
      },
    ],
    resources: [
      { title: "Official platform overview page", url: "https://www.3ds.com/3dexperience-platform", kind: "LINK", sizeText: "Reference" },
      { title: "Platform vocabulary workbook", url: "https://www.3ds.com/3dexperience-platform", kind: "PDF", sizeText: "Handout" },
      { title: "Lab exercise playlist (YouTube)", url: YT.catiaBeginnerPlaylist, kind: "LINK", sizeText: "Playlist" },
    ],
    faqs: [
      { q: "Do I need a paid licence to follow this course?", a: "No. Everything here runs on the free 3DEXPERIENCE tenant; paid roles are only needed for the advanced surfacing and simulation tracks." },
      { q: "Is this CATIA V5 or 3DEXPERIENCE CATIA?", a: "Both. The platform concepts are identical, and each design course shows the V5 and the 3DEXPERIENCE (xDesign / 3DDesign) side by side." },
      { q: "Will I get a certificate?", a: "Yes — finish every lesson and a verifiable certificate is generated in your student dashboard." },
    ],
  },
  {
    slug: "catia-part-design-bootcamp",
    title: "CATIA Part Design Bootcamp: Sketch to Fully-Defined Solid",
    subtitle: "The bread-and-butter course. 40 guided parts, zero “watch me click” filler.",
    level: "Beginner",
    category: "Design",
    price: 2499,
    mrpPrice: 4999,
    featured: true,
    tags: ["CATIA V5", "Part Design", "Sketcher", "Mechanical"],
    instructor: 0,
    trailer: YT.catiaOverview,
    description: `Part Design is where students either become confident or give up. This bootcamp fixes that with one rule: **every lesson ends with a part you build yourself and post for review**.

We start with fully-constrained sketches, move through dress-up features, patterns, Boolean operations and multi-body design, and finish with three portfolio projects — a gearbox housing, a connecting rod and a sheet-metal bracket.

Works with CATIA V5-6R2021 and above as well as CATIA on the 3DEXPERIENCE platform (3DDesign / xAddDesign).`,
    whatYouLearn: [
      "Sketcher discipline: constraints first, dimensions second, never a blue line",
      "Pad, Pocket, Shaft, Groove, Rib, Slot, Hole, Thread and Tap",
      "Dress-ups: fillet, chamfer, shell, thickness and draft",
      "Multi-body design, Booleans and the Combine workflow",
      "Productivity shortcuts, instant kits and PowerInput habits",
      "Parametric patterns that survive real design changes",
    ],
    requirements: [
      "CATIA V5 R21+ or a 3DEXPERIENCE role with Part Design",
      "Willingness to practise 45 minutes a day",
      "A mouse with a working middle button (seriously)",
    ],
    pool: [YT.catiaOverview, YT.catiaTips, YT.catiaPartPlaylist],
    modules: [
      {
        title: "Setup & Sketcher Fundamentals",
        summary: "Workbench tour, grid, snapping and the constraint solver.",
        lessons: [
          { title: "Interface tour: toolbars, specification tree, compass", mins: 15, preview: true, video: YT.catiaOverview },
          { title: "The five options every student must change on day one", mins: 12, video: YT.catiaTips },
          { title: "Geometric constraints vs dimension constraints", mins: 24, video: YT.catiaPartPlaylist },
          { title: "Construction elements and symmetry tricks", mins: 19, video: YT.catiaPartPlaylist },
          { title: "Exercise: fully-constrained flange profile", mins: 27, drive: true, video: YT.catiaTips },
        ],
      },
      {
        title: "Solid Features That Matter",
        summary: "The nine commands that cover 90% of mechanical parts.",
        lessons: [
          { title: "Pad, Pocket and the depth options nobody reads", mins: 22, video: YT.catiaPartPlaylist },
          { title: "Shaft and Groove from a revolved profile", mins: 18, video: YT.catiaPartPlaylist },
          { title: "Hole, Thread and Tap — cosmetic vs modelled", mins: 20, video: YT.catiaTips },
          { title: "Rib, Slot and Loft (multi-section solids)", mins: 26, video: YT.catiaPartPlaylist },
          { title: "Patterns: rectangular, circular, transformation features", mins: 21, video: YT.catiaPartPlaylist },
        ],
      },
      {
        title: "Dress-Up & Multi-Body",
        summary: "Fillet failures, shells and clean multi-body practice.",
        lessons: [
          { title: "Fillet and Chamfer without breaking the tree", mins: 23, video: YT.catiaTips },
          { title: "Shell, Thickness and Draft Analysis", mins: 19, video: YT.catiaPartPlaylist },
          { title: "Bodies, isolate and the Combine workflow", mins: 25, video: YT.catiaOverview },
          { title: "Booleans: add / remove / intersect / assemble", mins: 21, video: YT.catiaOverview },
        ],
      },
      {
        title: "Portfolio Projects",
        summary: "Three parts for your résumé, reviewed by the mentor.",
        lessons: [
          { title: "Project 1 — gearbox housing (guided build)", mins: 41, video: YT.catiaPartPlaylist },
          { title: "Project 2 — connecting rod with I-section", mins: 33, video: YT.catiaPartPlaylist },
          { title: "Project 3 — sheet-metal bracket and flat pattern intro", mins: 37, video: YT.catiaTips },
          { title: "Export STEP / IGES and check it in 3DPlay", mins: 16, video: YT.platformIntro },
        ],
      },
    ],
    resources: [
      { title: "Part Design shortcut card", url: "https://3dswym.3dexperience.3ds.com/post/catia-user-community/catia-v5-tips-and-tricks-tutorial_sc2johL8Tg2VFHNpqavbbg", kind: "PDF", sizeText: "Reference sheet" },
      { title: "Practice sketches pack — 40 exercises", url: YT.catiaBeginnerPlaylist, kind: "LINK", sizeText: "Playlist" },
      { title: "Free preview playlist on YouTube", url: YT.catiaPartPlaylist, kind: "LINK", sizeText: "Playlist" },
    ],
    faqs: [
      { q: "Do you review the parts I submit?", a: "Yes — post your model in the course community thread and you get an annotated review within 72 hours." },
      { q: "V5 or 3DEXPERIENCE?", a: "Both are shown. Around 90% of the workflow is identical; the platform version uses xAddDesign and 3DPDF for review." },
    ],
  },
  {
    slug: "catia-assembly-dmu-kinematics",
    title: "Assembly Design & DMU Kinematics on 3DEXPERIENCE",
    subtitle: "Build the machine, then make it move — clashes, joints, servos and cameras.",
    level: "Intermediate",
    category: "Design",
    price: 3499,
    mrpPrice: 6999,
    featured: true,
    tags: ["Assembly", "DMU", "Kinematics", "CATIA"],
    instructor: 0,
    trailer: YT.assembly,
    description: `Assemblies are where CAD skills turn into employable engineering. In this course you build a **58-part reciprocating compressor**, constrain it properly, run interference studies, then drive it with DMU Kinematics and publish a camera fly-through.

Everything is done on the 3DEXPERIENCE platform (Assembly Design, DMU Kinematics, 3DMARKUP) with the V5 equivalents shown for comparison.`,
    whatYouLearn: [
      "Product structure, components vs references, and clean naming",
      "The 14 assembly constraints and exactly when each one fails",
      "Clash and clearance studies with DMU SpaceAnalysis",
      "Joints, sets of elements, commands and servos",
      "Mechanisms, simulation with laws, trace curves and clocks",
      "Publish a camera walkthrough and export to 3DPDF",
    ],
    requirements: [
      "The Part Design bootcamp (or equivalent skills)",
      "Access to Assembly Design and DMU Kinematics workbenches",
    ],
    pool: [YT.assembly, YT.assembly2, YT.kinematics],
    modules: [
      {
        title: "Product Structure Done Right",
        summary: "Naming, anchors, and the questions a reviewer always asks.",
        lessons: [
          { title: "Insert new component: product vs part", mins: 18, preview: true, video: YT.assembly },
          { title: "Anchor, grasp and the 3D compass", mins: 16, video: YT.assembly2 },
          { title: "Components vs internal references", mins: 20, video: YT.assembly },
        ],
      },
      {
        title: "Constraints & Fasteners",
        summary: "Fix, coincidence, contact, offset, angled — with real tolerances.",
        lessons: [
          { title: "The 14 constraints in 25 minutes", mins: 25, video: YT.assembly2 },
          { title: "Fastener catalogue and HD2T", mins: 17, video: YT.assembly },
          { title: "Quick assembly: snap, fix and smart assembly", mins: 22, video: YT.assembly2 },
          { title: "Sub-assemblies: breaking down a machine", mins: 19, video: YT.assembly },
        ],
      },
      {
        title: "DMU SpaceAnalysis",
        summary: "Clashes, clearance, pull direction and wall analysis.",
        lessons: [
          { title: "Clash detection: ignore rules that actually work", mins: 21, video: YT.kinematics },
          { title: "Clearance and contact analysis", mins: 18, video: YT.kinematics },
          { title: "Sectioning and measuring inside an assembly", mins: 15, video: YT.assembly2 },
        ],
      },
      {
        title: "DMU Kinematics",
        summary: "Joints → mechanism → servo → law → trace.",
        lessons: [
          { title: "Create mechanism and fixed joint", mins: 16, preview: true, video: YT.kinematics },
          { title: "Revolute, prismatic and cylindrical joints", mins: 24, video: YT.kinematics },
          { title: "Screws, gears, rack-pinion and belts", mins: 26, video: YT.kinematics },
          { title: "Commands, simulation and laws", mins: 22, video: YT.assembly2 },
          { title: "Trace curves, clocks and cameras", mins: 19, video: YT.kinematics },
          { title: "Export the motion to 3DPDF for your report", mins: 14, drive: true, video: YT.platformIntro },
        ],
      },
    ],
    resources: [
      { title: "Compressor assembly starter geometry", url: "https://grabcad.com/tutorials/tutorial-assembly-design-catia-v5", kind: "LINK", sizeText: "Starter files" },
      { title: "Kinematics practice sheets (window regulator, scotch yoke)", url: YT.kinematics, kind: "LINK", sizeText: "Video series" },
    ],
    faqs: [
      { q: "Can I follow this without a Kinematics licence?", a: "DMU Kinematics Simulator is included in the 3DEXPERIENCE trial; after that you can still follow along with the recorded sessions." },
    ],
  },
  {
    slug: "generative-shape-design-surfacing",
    title: "Generative Shape Design: Class-A Surfacing on 3DEXPERIENCE",
    subtitle: "GSD, xShape and Blend mastery for automotive and consumer-product surfaces.",
    level: "Advanced",
    category: "Design",
    price: 4499,
    mrpPrice: 8999,
    tags: ["GSD", "Surfacing", "Class-A", "Automotive"],
    instructor: 1,
    trailer: YT.catiaOverview,
    description: `Surfacing is judgement, not buttons. This advanced track trains that judgement: curve continuity, isophotes, reflections, and how to build a surface that survives a manufacturing review.

Projects: a computer-mouse top skin, a side-mirror housing and a blend-filled wheel arch.`,
    whatYouLearn: [
      "Wireframe strategy: splines, projections, intersections, boundaries",
      "Fill, Blend, Sweep with guide curves and Power Surface",
      "G1/G2 continuity with isophote and curvature-comb analysis",
      "Healing, stitching and solidifying a surface",
      "Class-A checks: reflections, zebra stripes, deviation analysis",
    ],
    requirements: ["Solid Part Design skills", "CATIA GSD / xShape access", "Patience — surfacing is iterative"],
    pool: [YT.catiaOverview, YT.catiaTips, YT.catiaPartPlaylist],
    modules: [
      {
        title: "Curve Theory & Wireframe",
        summary: "Why your first spline is always wrong, and how to fix it.",
        lessons: [
          { title: "Continuity: G0 / G1 / G2 and curvature comb", mins: 20, preview: true, video: YT.catiaOverview },
          { title: "Spline editing like a stylist", mins: 24, video: YT.catiaTips },
          { title: "Projection, intersection and parallel curves", mins: 18, video: YT.catiaPartPlaylist },
        ],
      },
      {
        title: "Surface Creation",
        summary: "Fill, blend, sweep and boundary patches.",
        lessons: [
          { title: "Fill with boundaries and conversion", mins: 26, video: YT.catiaPartPlaylist },
          { title: "Blend between edges with tangency", mins: 23, video: YT.catiaOverview },
          { title: "Sweep: sections, guides and sub-axes", mins: 28, video: YT.catiaTips },
          { title: "Power Surface and surface fillets", mins: 21, video: YT.catiaOverview },
        ],
      },
      {
        title: "Analysis, Healing, Solidification",
        summary: "Make the surface manufacturable.",
        lessons: [
          { title: "Isophotes, curvature and reflection analysis", mins: 19, video: YT.catiaPartPlaylist },
          { title: "Healing, stitching and deviation", mins: 22, video: YT.catiaTips },
          { title: "Thick surface to solid, close volume", mins: 17, drive: true, video: YT.catiaOverview },
        ],
      },
    ],
    resources: [{ title: "Reference images for the mouse project", url: "https://grabcad.com/tutorials/software/catia?page=2&sort=most-viewed&tag=assembly&time=all", kind: "LINK", sizeText: "References" }],
    faqs: [{ q: "Is this suitable for V5 R20 users?", a: "Yes. 3DEXPERIENCE xShape shortcuts are shown in parallel with the V5 GSD commands." }],
  },
  {
    slug: "xcite-drafting-2d-documentation",
    title: "Engineering Drawing with 3DXCite & CATIA Drafting",
    subtitle: "GD&T-clean 2D drawings, title blocks, BOMs and PDF publishing from a model.",
    level: "Beginner",
    category: "Drafting & Documentation",
    price: 1499,
    mrpPrice: 2999,
    tags: ["Drafting", "GD&T", "3DXCite", "Drawing"],
    instructor: 1,
    trailer: YT.assembly2,
    description: `A drawing is a legal document. Learn to generate views, sections and details that a shop floor can actually manufacture from — with correct projection angles, datum references and tolerances.

Covers **3DXCite** on the 3DEXPERIENCE platform and **CATIA Drafting** in V5, plus the ISO/ASME conventions used by Indian and European supplier shops.`,
    whatYouLearn: [
      "Generate views from 3D with first-angle vs third-angle projection",
      "Sections, details, broken views and cutline annotations",
      "Dimensions, ISO 286 tolerances and geometric tolerancing symbols",
      "Surface finish, weld symbols and balloon annotations with a BOM",
      "Title blocks, sheet templates and multi-sheet drawings",
      "Publish 3DPDF packages for suppliers",
    ],
    requirements: ["Any CAD model you can open (we provide one)", "Basic reading of engineering drawings"],
    pool: [YT.assembly2, YT.catiaTips, YT.catiaOverview],
    modules: [
      {
        title: "Drawing Setup",
        summary: "Standards, formats, styles and title blocks.",
        lessons: [
          { title: "ISO vs ASME styles and sheet formats", mins: 14, preview: true, video: YT.assembly2 },
          { title: "Building a title block from a company template", mins: 19, video: YT.catiaTips },
          { title: "Generating front, section and isometric views", mins: 23, video: YT.catiaOverview },
        ],
      },
      {
        title: "Annotation & GD&T",
        summary: "The tolerances suppliers will phone you about.",
        lessons: [
          { title: "Dimension styles and smart dimensions", mins: 18, video: YT.assembly2 },
          { title: "Limits, fits and general tolerances", mins: 21, video: YT.catiaTips },
          { title: "Feature control frames made simple", mins: 25, video: YT.catiaOverview },
          { title: "Surface finish and weld symbols", mins: 16, video: YT.assembly2 },
        ],
      },
      {
        title: "BOM, Balloons & Publishing",
        summary: "From a drawing set to a release package.",
        lessons: [
          { title: "Parts list, balloons and item numbers", mins: 17, video: YT.catiaTips },
          { title: "3DPDF publishing with 3D annotations", mins: 20, drive: true, video: YT.platformIntro },
          { title: "Revision management on the platform", mins: 15, video: YT.enoviaConfig },
        ],
      },
    ],
    resources: [
      { title: "Drawing template walkthrough (recorded in lab)", url: HOSTED.examWalkthrough, kind: "LINK", sizeText: "MP4 · hosted file" },
      { title: "3DXCite product information", url: "https://www.3ds.com/3dexperience-platform", kind: "LINK", sizeText: "Reference" },
    ],
    faqs: [{ q: "Do I need 3DXCite to buy this?", a: "No. The 3DXDrafting trial or CATIA Drafting works; every lesson shows both." }],
  },
  {
    slug: "simulia-abaqus-structural-simulation",
    title: "SIMULIA Abaqus FEA: From Mesh to Report",
    subtitle: "Static, modal and contact studies on real parts — with mesh convergence proof.",
    level: "Intermediate",
    category: "Simulation",
    price: 3999,
    mrpPrice: 7999,
    featured: true,
    tags: ["SIMULIA", "Abaqus/CAE", "FEA", "Structural"],
    instructor: 2,
    trailer: YT.abaqusBasic,
    description: `Most students can run a simulation. Very few can defend one. This track teaches the engineering behind the buttons: element choice, integration scheme, contact stabilisation, boundary conditions and **mesh convergence** you can put in a report.

We analyse a bracket, a pressure-vessel nozzle, a bolted lap joint and a crash can — first in Abaqus/CAE, then automated with Python, then re-run as parameter studies.`,
    whatYouLearn: [
      "Part → property → assembly → step → interaction → load → mesh → job",
      "Element selection: C3D8R vs C3D8I vs shells/beams, hourglass control",
      "Mesh convergence and singularity-aware stress extraction",
      "Contact: penalty vs finite sliding, stabilisation, convergence fixes",
      "Linear buckling and normal-mode extraction",
      "Post-processing, reports and scripted parameter studies",
    ],
    requirements: ["Strength of materials basics", "Abaqus/CAE 2023+ or the SIMULIA role on 3DEXPERIENCE", "Python helpful but optional"],
    pool: [YT.abaqusStart, YT.abaqusBasic, YT.abaqusFast],
    modules: [
      {
        title: "Abaqus/CAE Fundamentals",
        summary: "The module tree, explained properly.",
        lessons: [
          { title: "Getting started with Abaqus in 30 minutes", mins: 31, preview: true, video: YT.abaqusStart },
          { title: "Materials, sections and property assignments", mins: 22, video: YT.abaqusBasic },
          { title: "Steps, output requests and incrementation", mins: 26, video: YT.abaqusFast },
        ],
      },
      {
        title: "Meshing & Elements",
        summary: "Where accurate results are actually won.",
        lessons: [
          { title: "Structured vs free meshing, seeds and biasing", mins: 24, video: YT.abaqusBasic },
          { title: "Element families and hourglassing", mins: 28, video: YT.abaqusStart },
          { title: "Mesh convergence study, step by step", mins: 33, video: YT.abaqusFast },
        ],
      },
      {
        title: "Contact & Nonlinearity",
        summary: "Make it converge, then trust it.",
        lessons: [
          { title: "Surface-to-surface contact pairs", mins: 27, video: YT.abaqusStart },
          { title: "Stabilisation, damping and artificial energy checks", mins: 25, video: YT.abaqusBasic },
          { title: "Plasticity and large displacement", mins: 29, video: YT.abaqusFast },
        ],
      },
      {
        title: "Projects & Automation",
        summary: "Bolted joint, nozzle, and Python parameter sweeps.",
        lessons: [
          { title: "Project — bolted lap joint with preload", mins: 35, video: YT.abaqusFast },
          { title: "Project — pressure-vessel nozzle reinforcement", mins: 31, video: YT.abaqusStart },
          { title: "Python scripting for parameter studies", mins: 26, drive: true, video: YT.abaqusBasic },
          { title: "Writing a defensible simulation report", mins: 18, video: YT.abaqusFast },
        ],
      },
    ],
    resources: [
      { title: "Solver input files & tips thread", url: "https://3dswym.3dexperience.3ds.com/post/catia-user-community/catia-v5-tips-and-tricks-tutorial_sc2johL8Tg2VFHNpqavbbg", kind: "LINK", sizeText: ".inp + .cae pack" },
      { title: "Simulation report template", url: "https://www.3ds.com/3dexperience-platform", kind: "PDF", sizeText: "Checklist" },
    ],
    faqs: [
      { q: "Which licence do I need?", a: "Abaqus/CAE 2023 or the SIMULIA Structural Mechanics Engineer role on 3DEXPERIENCE. Cloud credits are plenty for these model sizes." },
      { q: "Is theory covered?", a: "Only what a reviewer will ask: shape functions, convergence, Saint-Venant's principle and energy balance." },
    ],
  },
  {
    slug: "enovia-plm-requirements-to-release",
    title: "ENOVIA PLM: From Requirement to Release on 3DEXPERIENCE",
    subtitle: "VPLM, 3DXRequirements, change actions and a real release workflow.",
    level: "Intermediate",
    category: "PLM & Collaboration",
    price: 1999,
    mrpPrice: 3999,
    tags: ["ENOVIA", "PLM", "Requirements", "Change Management"],
    instructor: 1,
    trailer: YT.enoviaConfig,
    description: `Learn the "P" in PLM by running a product launch on the platform: requirements captured from a customer brief, functions traced to parts, a change action handling an engineering query, and a release a supplier can consume.

This is the course colleges skip and recruiters ask about.`,
    whatYouLearn: [
      "Business objects: the 3DEXPERIENCE data model in plain language",
      "3DXRequirements, function tree and product breakdown structure",
      "Immersive views, 3DDashboard and reporting",
      "Change actions, engineering changes, review and approval flows",
      "Configuration and variant management",
      "The PLM KPIs an interviewer expects you to know",
    ],
    requirements: ["Any CAD exposure", "A 3DEXPERIENCE tenant with ENOVIA roles (trial is fine)"],
    pool: [YT.enoviaConfig, YT.platformCustom, YT.platformIntro],
    modules: [
      {
        title: "PLM Mental Model",
        summary: "Objects, lifecycle, and why “check out” is the wrong instinct.",
        lessons: [
          { title: "What PLM is for — and what it is not", mins: 16, preview: true, video: YT.enoviaConfig },
          { title: "Data model: parts, docs, revisions, contexts", mins: 23, video: YT.platformCustom },
          { title: "Lifecycle states and rules", mins: 19, video: YT.platformIntro },
        ],
      },
      {
        title: "Requirements & Traceability",
        summary: "From a customer brief to a verification result.",
        lessons: [
          { title: "3DXRequirements set-up and authoring", mins: 25, video: YT.enoviaConfig },
          { title: "Function tree and PBS", mins: 21, video: YT.platformCustom },
          { title: "Traceability matrices and coverage dashboards", mins: 18, video: YT.enoviaConfig },
        ],
      },
      {
        title: "Change & Release",
        summary: "ECO, approvals and configuration control.",
        lessons: [
          { title: "Change actions and engineering changes", mins: 24, video: YT.platformCustom },
          { title: "Configuration management recap", mins: 20, video: YT.enoviaConfig },
          { title: "Release to supplier and the 3DPDF package", mins: 17, drive: true, video: YT.platformIntro },
        ],
      },
    ],
    resources: [{ title: "ENOVIA learning hub", url: "https://www.3ds.com/3dexperience-platform", kind: "LINK", sizeText: "Hub" }],
    faqs: [{ q: "Is this useful for placements?", a: "Very — requirement-to-release traceability is a common question for core + digital roles." }],
  },
  {
    slug: "delmia-robotics-digital-manufacturing",
    title: "DELMIA Robotics & Digital Manufacturing",
    subtitle: "Process plan, robot offline programming, reach and cycle-time validation.",
    level: "Advanced",
    category: "Manufacturing",
    price: 4999,
    mrpPrice: 9999,
    tags: ["DELMIA", "Robotics", "Ergonomics", "Digital Factory"],
    instructor: 2,
    trailer: YT.delmiaRobot,
    description: `Design the factory before you build it. Plan a welding cell, place robots, drive them with DELMIA Robot Process Simulator, validate reach and cycle time, then hand the program to a physical controller.

Uses the **DELMIA Orp** and **Robot Process Simulator** roles on the 3DEXPERIENCE platform.`,
    whatYouLearn: [
      "Resource model: robots, EOAT, TCP and work-holding",
      "Operation and process planning with manufacturing features",
      "Robot offline programming with waypoints and paths",
      "Reachability, collision and cycle-time validation",
      "Manikin ergonomics checks",
      "Post-processing and handing code to the controller",
    ],
    requirements: ["3DEXPERIENCE DELMIA roles (trial)", "Basic understanding of robot axes and frames"],
    pool: [YT.delmiaRobot, YT.delmiaRobot2, YT.kinematics],
    modules: [
      {
        title: "Cell Modelling",
        summary: "Layout, resources and the frames that matter.",
        lessons: [
          { title: "Robot, EOAT and TCP set-up", mins: 26, preview: true, video: YT.delmiaRobot2 },
          { title: "Work-holding, fixtures and jigs", mins: 20, video: YT.delmiaRobot },
          { title: "Cell layout and ergonomic clearances", mins: 22, video: YT.delmiaRobot2 },
        ],
      },
      {
        title: "Process & Operations",
        summary: "OPM and manufacturing features.",
        lessons: [
          { title: "Operation definition and resources", mins: 23, video: YT.delmiaRobot },
          { title: "Manufacturing features and machining operations", mins: 27, video: YT.delmiaRobot2 },
          { title: "Cycle-time estimation", mins: 18, video: YT.delmiaRobot },
        ],
      },
      {
        title: "Robot Programming & Validation",
        summary: "Teach, simulate, validate, post.",
        lessons: [
          { title: "Waypoints, paths and joint vs linear moves", mins: 31, video: YT.delmiaRobot },
          { title: "Reachability and collision studies", mins: 24, video: YT.delmiaRobot2 },
          { title: "Post-process and controller hand-off", mins: 19, drive: true, video: YT.delmiaRobot },
          { title: "Manikin ergonomics quick pass", mins: 21, video: YT.delmiaRobot2 },
        ],
      },
    ],
    resources: [{ title: "Robot catalogue & starter geometry", url: "https://grabcad.com/tutorials/tutorial-assembly-design-catia-v5", kind: "LINK", sizeText: "JT / 3DXML" }],
    faqs: [{ q: "Which robot brands are covered?", a: "ABB, Fanuc and KUKA post-processor examples are provided; the workflow is brand-agnostic." }],
  },
  {
    slug: "solidworks-3dexperience-cloud-roles",
    title: "SOLIDWORKS on the 3DEXPERIENCE Platform",
    subtitle: "xDesign, xDrafting, cloud roles, vaulting and revision control for design teams.",
    level: "Beginner",
    category: "Design",
    price: 2999,
    mrpPrice: 4999,
    tags: ["SOLIDWORKS", "xDesign", "Cloud", "PDM"],
    instructor: 0,
    trailer: YT.swPlatform,
    description: `If your team lives in SOLIDWORKS, this is the practical bridge to the platform: keep desktop SOLIDWORKS, add cloud roles for review, revision control and collaboration — without buying a full PDM server.

Built around **xDesign**, **xDrafting**, **3DLayout**, **3DSwym** and the Collaborative Business Innovator role.`,
    whatYouLearn: [
      "Install and connect the 3DEXPERIENCE roles to desktop SOLIDWORKS",
      "Vault vs myPC: where files live and what that means",
      "xDesign and xDrafting for browser-based work",
      "Revision control, labels and safe release",
      "Concurrent design by two engineers in one assembly",
      "Markup and mobile review with 3DPlay",
    ],
    requirements: ["SOLIDWORKS 2022+ (trial OK)", "A 3DEXPERIENCE Connected or 3DDesigner role"],
    pool: [YT.swPlatform, YT.platformIntro, YT.catiaTips],
    modules: [
      {
        title: "Connecting SOLIDWORKS to the Cloud",
        summary: "Launcher, roles and your first vaulted part.",
        lessons: [
          { title: "Platform overview for SOLIDWORKS users", mins: 17, preview: true, video: YT.swPlatform },
          { title: "Install the connector and verify roles", mins: 13, video: YT.platformIntro },
          { title: "Vault your first part and revise it", mins: 21, video: YT.swPlatform },
        ],
      },
      {
        title: "xDesign & xDrafting",
        summary: "Browser CAD that is good enough for real work.",
        lessons: [
          { title: "xDesign part modelling basics", mins: 25, video: YT.platformIntro },
          { title: "xDrafting a release-ready drawing", mins: 22, video: YT.swPlatform },
          { title: "3DLayout: plant and line layout in the browser", mins: 19, video: YT.platformIntro },
        ],
      },
      {
        title: "Teamwork & Release",
        summary: "Two designers, one assembly, no conflicts.",
        lessons: [
          { title: "Concurrent assembly editing", mins: 20, video: YT.swPlatform },
          { title: "Labels, milestones and approvals", mins: 16, video: YT.enoviaConfig },
          { title: "Review in 3DPlay on a tablet on the shop floor", mins: 14, video: YT.platformIntro },
        ],
      },
    ],
    resources: [{ title: "3DEXPERIENCE community threads for SOLIDWORKS users", url: "https://3dswym.3dexperience.3ds.com/post/catia-user-community/catia-v5-tips-and-tricks-tutorial_sc2johL8Tg2VFHNpqavbbg", kind: "LINK", sizeText: "Community" }],
    faqs: [{ q: "Do I lose my SOLIDWORKS files?", a: "No — local files stay put. Only data you intentionally vault goes to the platform." }],
  },
];

/* ------------------------------------------------------------------ */

const ytId = (url: string) => {
  const m = /v=([\w-]{11})/.exec(url);
  if (m) return m[1];
  const m2 = /youtu\.be\/([\w-]{11})/.exec(url);
  if (m2) return m2[1];
  const m3 = /list=([\w-]+)/.exec(url);
  return m3 ? `${m3[1]}&playlist` : "hx1CXpqVDQ";
};

function main() {
  const db = getDb();
  void db;
  const tables = ["activity_log", "certificates", "lesson_progress", "enrollments", "reviews", "faqs", "resources", "lessons", "modules", "courses", "users"];
  console.log("↻ clearing tables");
  for (const t of tables) run(`DELETE FROM ${t}`);

  console.log("↻ users");
  const userIds: string[] = [];
  for (const u of USERS) {
    const id = newId();
    insert("users", {
      id,
      email: u.email,
      name: u.name,
      role: u.role,
      headline: u.headline ?? null,
      bio: u.bio || null,
      image: null,
      google_id: `demo-${u.email}`,
      created_at: nowIso(),
      updated_at: nowIso(),
      last_login_at: nowIso(),
    });
    userIds.push(id);
  }
  const [adminId, nehaId, vikramId, studentId, priyaId, sameerId, ananyaId, rahulId] = userIds;

  console.log("↻ courses");
  const courseIds: string[] = [];
  for (const [cIndex, c] of COURSES.entries()) {
    const courseId = newId();
    let totalMins = 0;
    const created = new Date(Date.now() - (COURSES.length - cIndex) * 86400000 * 19).toISOString();
    insert("courses", {
      id: courseId,
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle,
      description: c.description,
      what_you_learn: c.whatYouLearn.join("\n"),
      requirements: c.requirements.join("\n"),
      level: c.level,
      category: c.category,
      language: "English",
      thumbnail: /watch\?v=/.test(c.trailer) ? `https://i.ytimg.com/vi/${ytId(c.trailer)}/maxresdefault.jpg` : null,
      hero_video_url: c.trailer,
      price: c.price,
      mrp_price: c.mrpPrice,
      duration_mins: 0,
      published: true,
      featured: Boolean(c.featured),
      certificate_on: c.title.split(":")[0],
      tags: c.tags.join(", "),
      instructor_id: [adminId, nehaId, vikramId][c.instructor % 3],
      created_at: created,
      updated_at: created,
    });
    courseIds.push(courseId);

    let lessonTotal = 0;
    c.modules.forEach((m, mIndex) => {
      const moduleId = newId();
      insert("modules", { id: moduleId, course_id: courseId, title: m.title, summary: m.summary, position: mIndex });
      m.lessons.forEach((l, lIndex) => {
        const video = l.drive ? HOSTED.labRecording : l.video ?? c.pool[(mIndex * 3 + lIndex) % c.pool.length];
        insert("lessons", {
          id: newId(),
          module_id: moduleId,
          title: l.title,
          description: `We work through ${l.title.toLowerCase()}, then you repeat it on your own model and post the result for review.`,
          video_url: video,
          duration_mins: l.mins,
          position: lIndex,
          is_preview: Boolean(l.preview),
          notes: l.drive ? `${l.notes ? l.notes + "\n\n" : ""}${DEMO_MEDIA_NOTE}` : (l.notes ?? null),
        });
        totalMins += l.mins;
        lessonTotal++;
      });
    });

    for (const r of c.resources) {
      insert("resources", {
        id: newId(),
        course_id: courseId,
        lesson_id: null,
        title: r.title,
        url: r.url,
        kind: r.kind,
        size_text: r.sizeText ?? null,
      });
    }
    c.faqs.forEach((f, i) => insert("faqs", { id: newId(), course_id: courseId, question: f.q, answer: f.a, position: i }));

    run("UPDATE courses SET duration_mins = ? WHERE id = ?", [totalMins, courseId]);
    console.log(`  ✓ ${c.title} — ${c.modules.length} modules · ${lessonTotal} lessons · ${Math.round(totalMins / 60)}h`);
  }

  const lessonsOf = (courseId: string) =>
    Array.from(
      db.prepare(
        `SELECT l.id, l.duration_mins FROM lessons l JOIN modules m ON m.id = l.module_id
          WHERE m.course_id = ? ORDER BY m.position, l.position`,
      ).all(courseId) as { id: string; duration_mins: number }[],
    );

  /** enroll a demo student in `courseIdx`s and mark the first `done` lessons complete */
  const enrolmentPlans = [
    { userId: studentId, courses: [0, 1, 5], done: [12, 7, 2] },
    { userId: priyaId, courses: [0, 2, 3], done: [12, 4, 0] },
    { userId: sameerId, courses: [1, 4], done: [3, 9] },
    { userId: ananyaId, courses: [0, 6, 7], done: [12, 2, 1] },
    { userId: rahulId, courses: [1, 8], done: [1, 0] },
  ];

  console.log("↻ enrolments & progress");
  for (const plan of enrolmentPlans) {
    plan.courses.forEach((idx, i) => {
      const courseId = courseIds[idx];
      if (!courseId) return;
      const lessons = lessonsOf(courseId);
      const done = Math.min(plan.done[i] ?? 0, lessons.length);
      const enrolmentId = newId();
      insert("enrollments", {
        id: enrolmentId,
        user_id: plan.userId,
        course_id: courseId,
        progress_pct: lessons.length ? Number(((done / lessons.length) * 100).toFixed(2)) : 0,
        last_lesson_id: lessons[Math.min(done, lessons.length - 1)]?.id ?? null,
        status: done > 0 && done === lessons.length ? "COMPLETED" : "ACTIVE",
        enrolled_at: new Date(Date.now() - (i + 2) * 86400000 * 11).toISOString(),
        completed_at: done === lessons.length && lessons.length ? nowIso() : null,
      });
      lessons.slice(0, done).forEach((l, k) =>
        insert("lesson_progress", {
          id: newId(),
          user_id: plan.userId,
          lesson_id: l.id,
          completed: true,
          watched_secs: l.duration_mins * 60,
          updated_at: new Date(Date.now() - (done - k) * 3600000).toISOString(),
          completed_at: new Date(Date.now() - (done - k) * 3600000).toISOString(),
        }),
      );
      if (done === lessons.length && lessons.length) {
        insert("certificates", {
          id: newId(),
          credential_id: credentialId(),
          user_id: plan.userId,
          course_id: courseId,
          issued_at: nowIso(),
        });
      }
      const title = (db.prepare("SELECT title FROM courses WHERE id = ?").get(courseId) as { title: string }).title;
      insert("activity_log", {
        id: newId(),
        user_id: plan.userId,
        type: "ENROLL",
        message: `enrolled in ${title}`,
        meta: JSON.stringify({ courseId }),
        created_at: new Date(Date.now() - (i + 2) * 86400000 * 11).toISOString(),
      });
    });
  }

  console.log("↻ reviews");
  const reviewTexts = [
    "I stopped copying clicks and started understanding why each constraint exists. The gearbox project alone got me an interview call.",
    "Videos load instantly and the progress bar keeps me honest. Finished the drafting course in two weekends.",
    "The simulation track is the closest thing to having a senior engineer review my work. Mesh convergence finally clicked.",
    "Perfect for our lab — 60 students, one admin panel, and I can upload our own recorded classes as Drive links.",
    "Certificate is verifiable, which HR actually checked. Told three juniors about this already.",
    "Clear, short lessons. I could pause, model along, and come back the next day without losing the thread.",
  ];
  const reviewers = [studentId, priyaId, sameerId, ananyaId, rahulId];
  reviewers.forEach((userId, i) => {
    for (const courseId of courseIds.slice(i % 4, (i % 4) + 2)) {
      insert("reviews", {
        id: newId(),
        user_id: userId,
        course_id: courseId,
        rating: [5, 5, 4, 5, 5][i % 5],
        comment: reviewTexts[(i + courseId.length) % reviewTexts.length],
        created_at: nowIso(),
      });
    }
  });

  console.log("↻ admin activity");
  [
    ["COURSE_PUBLISHED", "Published “SIMULIA Abaqus FEA: From Mesh to Report”", adminId],
    ["LESSON_UPLOADED", "Uploaded 4 new lessons to “CATIA Part Design Bootcamp” from Drive", adminId],
    ["USER_ADDED", "Invited rahul@3dsacademy.dev to “SOLIDWORKS on the 3DEXPERIENCE Platform”", adminId],
    ["CERTIFICATE", "Certificate issued to Arjun Verma for 3DEXPERIENCE Platform Foundation", studentId],
    ["LESSON_UPLOADED", "Replaced trailer with a YouTube playlist link", nehaId],
  ].forEach(([type, message, userId], i) =>
    insert("activity_log", {
      id: newId(),
      user_id: userId as string,
      type: type as string,
      message: message as string,
      meta: null,
      created_at: new Date(Date.now() - i * 7200000).toISOString(),
    }),
  );

  const counts = tables
    .map((t) => `${t.replace(/_/g, " ")}=${(db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get() as { c: number }).c}`)
    .join("  ");
  console.log(`\n✔ seeded: ${counts}`);
  console.log("   admin   → admin@3dsacademy.dev");
  console.log("   student → student@3dsacademy.dev");
}

main();
