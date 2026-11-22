const SHEET_ID = '1VnfBYa3NifAQ-R3L-UbxxuGeqP49Fd8db0CpIQ-AvEU';
const SHEETS = {
  'Tahun 1': { gid: '1976884325' },
  'Tahun 2': { gid: '810678928' },
  'Tahun 3': { gid: '177173064' },
  'Tahun 4': { gid: '879145108' },
  'Tahun 5': { gid: '1419236165' }
};

let currentClass = 'Tahun 1';
let allData = {}; // cache by class
let currentStudents = [];

const classButtons = document.querySelectorAll('.class-buttons button');
const searchInput = document.getElementById('searchInput');
const tableHead = document.getElementById('tableHead');
const tableBody = document.getElementById('tableBody');
const resultsTable = document.getElementById('resultsTable');
const loading = document.getElementById('loading');
const noResults = document.getElementById('noResults');
const printClassBtn = document.getElementById('printClassBtn');
const refreshBtn = document.getElementById('refreshBtn');
const reportModal = document.getElementById('reportModal');
const individualReport = document.getElementById('individualReport');
const closeModal = document.querySelector('.close-modal');
const printIndividualBtn = document.getElementById('printIndividualBtn');

// Subject abbreviations for table header
const SUBJECTS = [
  { key: 'sirah', name: 'Sirah', short: 'Sirah' },
  { key: 'bahasa_arab', name: 'Bahasa Arab', short: 'B. Arab' },
  { key: 'jawi_khat', name: 'Jawi & Khat', short: 'Jawi' },
  { key: 'akidah', name: 'Akidah', short: 'Akidah' },
  { key: 'adab', name: 'Adab', short: 'Adab' },
  { key: 'ibadah', name: 'Ibadah', short: 'Ibadah' },
  { key: 'alquran', name: 'Tilawah Al-Quran', short: 'Al-Quran' }
];

async function fetchSheet(className) {
  if (allData[className]) return allData[className];

  const gid = SHEETS[className].gid;
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Gagal memuatkan data');
    const csvText = await response.text();
    const parsed = parseCSV(csvText, className);
    allData[className] = parsed;
    return parsed;
  } catch (err) {
    console.error(err);
    alert('Ralat memuatkan data. Sila semak sambungan internet atau pastikan Google Sheet dikongsi secara awam.');
    return null;
  }
}

function parseCSV(csvText, className) {
  const lines = csvText.split('\n').map(l => l.split(',').map(c => c.trim()));
  
  let school = 'KAFA Sekolah Kebangsaan Paloh Hinai';
  let examTitle = 'KEPUTUSAN PEPERIKSAAN AKHIR TAHUN 2026';
  let examDate = '11 - 16 November 2026';
  let teacher = '';

  // Extract header info
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i].join(' ').toUpperCase();
    if (line.includes('SEKOLAH KEBANGSAAN') || line.includes('KAFA')) {
      const schoolMatch = lines[i].find(c => c && c.length > 10);
      if (schoolMatch) school = schoolMatch;
    }
    if (line.includes('TARIKH')) {
      const dateIdx = lines[i].findIndex(c => c.toUpperCase().includes('TARIKH'));
      if (dateIdx >= 0 && lines[i][dateIdx + 1]) examDate = lines[i][dateIdx + 1];
    }
  }

  // Find header row with BIL.
  let headerIdx = lines.findIndex(row => row[0] === 'BIL.' || row[0] === 'BIL');
  if (headerIdx === -1) headerIdx = 9;

  const subjectLine = lines[headerIdx + 1] || [];
  const dataStart = headerIdx + 3;

  const students = [];
  for (let i = dataStart; i < lines.length; i++) {
    const row = lines[i];
    if (!row[0] || isNaN(parseInt(row[0]))) continue; // not a data row

    const bil = row[0];
    const name = row[1] || '';
    if (!name) continue;

    const student = {
      bil,
      name,
      class: className,
      subjects: {},
      total: '',
      percentage: '',
      rank: '',
      overallGrade: ''
    };

    // Map subjects by position (standard layout from the sheet)
    // col 6-19 are the 7 subjects (mark, grade pairs)
    const subjectKeys = ['sirah', 'bahasa_arab', 'jawi_khat', 'akidah', 'adab', 'ibadah', 'alquran'];
    for (let s = 0; s < subjectKeys.length; s++) {
      const markCol = 6 + (s * 2);
      const gradeCol = markCol + 1;
      student.subjects[subjectKeys[s]] = {
        mark: row[markCol] || '-',
        grade: row[gradeCol] || '-'
      };
    }

    // Total, percentage, rank - look from the end
    const nonEmpty = row.map((v, idx) => ({v, idx})).filter(x => x.v && x.v !== '');
    if (nonEmpty.length >= 3) {
      // Typically last three: total, %, rank
      const last = nonEmpty.slice(-3);
      student.total = last[0]?.v || '';
      student.percentage = last[1]?.v || '';
      student.rank = last[2]?.v || '';
    }

    students.push(student);
  }

  return { school, examTitle, examDate, teacher, students, className };
}

function renderTable(students, classInfo) {
  currentStudents = students;

  // Update info bar
  document.getElementById('examDate').textContent = `Tarikh: ${classInfo.examDate || '11 - 16 November 2026'}`;
  document.getElementById('schoolName').textContent = classInfo.school || 'KAFA Sekolah Kebangsaan Paloh Hinai';

  // Build header
  let headHTML = `<tr>
    <th>Bil</th>
    <th>Nama Pelajar</th>`;
  SUBJECTS.forEach(sub => {
    headHTML += `<th>${sub.short}</th>`;
  });
  headHTML += `<th>Jumlah</th><th>%</th><th>Kedudukan</th><th>Tindakan</th></tr>`;
  tableHead.innerHTML = headHTML;

  // Build body
  if (students.length === 0) {
    resultsTable.style.display = 'none';
    noResults.style.display = 'block';
    return;
  }

  noResults.style.display = 'none';
  resultsTable.style.display = 'table';

  let bodyHTML = '';
  students.forEach(s => {
    bodyHTML += `<tr>
      <td>${s.bil}</td>
      <td>${s.name}</td>`;
    SUBJECTS.forEach(sub => {
      const subj = s.subjects[sub.key] || { mark: '-', grade: '-' };
      const gradeClass = subj.grade ? `grade-${subj.grade}` : '';
      bodyHTML += `<td class="${gradeClass}">${subj.grade !== '-' ? subj.grade : (subj.mark !== '-' ? subj.mark : '-')}</td>`;
    });
    bodyHTML += `<td><strong>${s.total || '-'}</strong></td>
      <td>${s.percentage || '-'}</td>
      <td>${s.rank || '-'}</td>
      <td><button class="btn-small view-btn" data-name="${encodeURIComponent(s.name)}">Lihat</button></td>
    </tr>`;
  });
  tableBody.innerHTML = bodyHTML;

  // Attach view buttons
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = decodeURIComponent(btn.dataset.name);
      showIndividualReport(name);
    });
  });
}

function showIndividualReport(name) {
  const student = currentStudents.find(s => s.name === name);
  if (!student) return;

  const info = allData[currentClass];

  let subjectsHTML = '';
  SUBJECTS.forEach(sub => {
    const subj = student.subjects[sub.key] || { mark: '-', grade: '-' };
    subjectsHTML += `<tr>
      <td style="text-align:left">${sub.name}</td>
      <td>${subj.mark}</td>
      <td class="grade-${subj.grade}">${subj.grade}</td>
    </tr>`;
  });

  individualReport.innerHTML = `
    <div class="report-card printable">
      <div class="report-header">
        <div class="arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        <h2>SLIP KEPUTUSAN PEPERIKSAAN KAFA</h2>
        <p>Akhir Tahun 2026</p>
        <p><strong>${info.school}</strong></p>
      </div>

      <div class="student-info">
        <div><strong>Nama:</strong> ${student.name}</div>
        <div><strong>Kelas:</strong> ${student.class}</div>
        <div><strong>No. Bil:</strong> ${student.bil}</div>
        <div><strong>Tarikh:</strong> ${info.examDate}</div>
      </div>

      <table class="subjects-table">
        <thead>
          <tr>
            <th>Mata Pelajaran</th>
            <th>Markah</th>
            <th>Gred</th>
          </tr>
        </thead>
        <tbody>
          ${subjectsHTML}
        </tbody>
      </table>

      <div class="summary">
        <div>Jumlah Markah: <strong>${student.total || '-'}</strong></div>
        <div>Peratusan: <strong>${student.percentage || '-'}%</strong></div>
        <div>Kedudukan: <strong>${student.rank || '-'}</strong></div>
      </div>

      <div class="signatures">
        <div>
          <div class="line">Tandatangan Guru Kelas</div>
        </div>
        <div>
          <div class="line">Tandatangan Guru Besar</div>
        </div>
      </div>
    </div>
  `;

  reportModal.style.display = 'block';
}

function filterStudents(students, query) {
  if (!query) return students;
  const q = query.toLowerCase();
  return students.filter(s => s.name.toLowerCase().includes(q));
}

async function loadClass(className) {
  currentClass = className;
  loading.style.display = 'block';
  resultsTable.style.display = 'none';
  noResults.style.display = 'none';

  // Update active button
  classButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.class === className);
  });

  const data = await fetchSheet(className);
  loading.style.display = 'none';

  if (data && data.students) {
    const filtered = filterStudents(data.students, searchInput.value);
    renderTable(filtered, data);
  } else {
    noResults.style.display = 'block';
    noResults.textContent = 'Gagal memuatkan data.';
  }
}

// Event Listeners
classButtons.forEach(btn => {
  btn.addEventListener('click', () => loadClass(btn.dataset.class));
});

searchInput.addEventListener('input', () => {
  if (allData[currentClass]) {
    const filtered = filterStudents(allData[currentClass].students, searchInput.value);
    renderTable(filtered, allData[currentClass]);
  }
});

printClassBtn.addEventListener('click', () => {
  if (!currentStudents.length) return;
  // Simple print of current table
  window.print();
});

refreshBtn.addEventListener('click', () => {
  delete allData[currentClass];
  loadClass(currentClass);
});

closeModal.addEventListener('click', () => {
  reportModal.style.display = 'none';
});

printIndividualBtn.addEventListener('click', () => {
  // Make modal printable
  reportModal.classList.add('printable');
  window.print();
  reportModal.classList.remove('printable');
});

window.addEventListener('click', (e) => {
  if (e.target === reportModal) {
    reportModal.style.display = 'none';
  }
});

// Initial load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => loadClass('Tahun 1'));
} else {
  loadClass('Tahun 1');
}

// Small button style
const style = document.createElement('style');
style.textContent = `
  .btn-small {
    padding: 0.3rem 0.7rem;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.8rem;
  }
  .btn-small:hover { background: var(--primary-light); }
`;
document.head.appendChild(style);
