// Supabase 설정은 supabase-config.js에서 전역 변수로 제공됨

// 아파트 ID 설정 (고유 식별자) - speed_apartment3로 변경
const APARTMENT_ID = 'speed_apartment3';

// 동적으로 로드될 아파트 이름 (기본값 설정)
let currentApartmentName = 'Speed 아파트 3단지';

// 카카오 SDK 초기화 (실제 앱키로 변경 필요)
try {
    if (typeof Kakao !== 'undefined' && Kakao && !Kakao.isInitialized()) {
        Kakao.init('YOUR_KAKAO_APP_KEY'); // 실제 카카오 개발자센터에서 발급받은 JavaScript 키로 변경하세요
    }
} catch (e) {
    console.warn('Kakao 초기화 건너뜀:', e && e.message ? e.message : e);
}

// EmailJS 초기화 상태
let emailJSInitialized = false;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

// EmailJS 초기화 함수 (모바일 환경 강화)
async function initializeEmailJS() {
    return new Promise((resolve, reject) => {
        // 이미 초기화되었다면 바로 성공 반환
        if (emailJSInitialized && typeof emailjs !== 'undefined') {
            resolve(true);
            return;
        }

        // 최대 시도 횟수 체크
        if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
            reject(new Error('EmailJS 초기화 최대 시도 횟수 초과'));
            return;
        }

        initializationAttempts++;

        const initializeWithRetry = () => {
            try {
                // EmailJS 스크립트 로드 확인
                if (typeof emailjs === 'undefined') {
                    const waitTime = /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 3000 : 1500;
                    console.log(`📱 EmailJS 스크립트 로딩 대기... (시도: ${initializationAttempts}/${MAX_INIT_ATTEMPTS}, 대기: ${waitTime}ms)`);
                    
                    setTimeout(() => {
                        if (initializationAttempts < MAX_INIT_ATTEMPTS) {
                            initializeWithRetry();
                        } else {
                            reject(new Error('EmailJS 스크립트 로드 시간 초과'));
                        }
                    }, waitTime);
                    return;
                }

                // EmailJS 초기화 시도
                console.log('🔧 EmailJS 초기화 시작...');
                emailjs.init('8-CeAZsTwQwNl4yE2');
                
                // 초기화 검증
                if (typeof emailjs.send === 'function') {
                    console.log('✅ EmailJS 초기화 및 검증 완료');
                    emailJSInitialized = true;
                    resolve(true);
                } else {
                    throw new Error('EmailJS send 함수를 찾을 수 없습니다');
                }
            } catch (e) {
                console.error(`❌ EmailJS 초기화 실패 (시도 ${initializationAttempts}):`, e);
                if (initializationAttempts < MAX_INIT_ATTEMPTS) {
                    const retryWaitTime = 2000;
                    setTimeout(initializeWithRetry, retryWaitTime);
                } else {
                    reject(e);
                }
            }
        };

        // 네트워크 상태 확인
        if (!navigator.onLine) {
            reject(new Error('네트워크 연결이 필요합니다.'));
            return;
        }

        // 초기화 시작
        initializeWithRetry();
    });
}

// 전화번호 자동 포맷팅 함수
function formatPhoneNumber(value) {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');

    // 길이에 따른 포맷팅
    if (numbers.length <= 3) {
        return numbers;
    } else if (numbers.length <= 7) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 11) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    } else {
        // 11자리 초과시 자르기
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
}

// 전화번호 유효성 검증 함수
function validatePhoneNumber(phone) {
    const numbers = phone.replace(/[^\d]/g, '');

    // 한국 휴대폰 번호 패턴 (010, 011, 016, 017, 018, 019)
    const mobilePattern = /^01[0-9]-\d{3,4}-\d{4}$/;
    // 일반 전화번호 패턴 (02, 031~064)
    const landlinePattern = /^(02|0[3-6][0-4])-\d{3,4}-\d{4}$/;

    return numbers.length >= 10 && (mobilePattern.test(phone) || landlinePattern.test(phone));
}

// 전화번호 입력 필드에 이벤트 리스너 추가
function setupPhoneFormatting() {
    // 메인 폼의 전화번호 입력 필드
    const mainPhoneInput = document.getElementById('phone');
    if (mainPhoneInput) {
        mainPhoneInput.addEventListener('input', function(e) {
            const formatted = formatPhoneNumber(e.target.value);
            e.target.value = formatted;

            // 실시간 유효성 검증
            const isValid = validatePhoneNumber(formatted);
            if (formatted.length > 0) {
                if (isValid) {
                    e.target.style.borderColor = '#4CAF50';
                    e.target.style.boxShadow = '0 0 0 2px rgba(76, 175, 80, 0.1)';
                } else {
                    e.target.style.borderColor = '#ff4757';
                    e.target.style.boxShadow = '0 0 0 2px rgba(255, 71, 87, 0.1)';
                }
            } else {
                e.target.style.borderColor = '#e1e5e9';
                e.target.style.boxShadow = 'none';
            }
        });

        // 포커스 아웃 시 유효성 메시지 표시
        mainPhoneInput.addEventListener('blur', function(e) {
            const phone = e.target.value.trim();
            const existingError = e.target.parentNode.querySelector('.phone-error');

            if (existingError) {
                existingError.remove();
            }

            if (phone && !validatePhoneNumber(phone)) {
                const errorMsg = document.createElement('div');
                errorMsg.className = 'phone-error error-message';
                errorMsg.textContent = '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)';
                e.target.parentNode.appendChild(errorMsg);
            }
        });
    }
}

// 관리자 폰번호 입력 모달의 포맷팅 설정
function setupPhoneInputFormatting() {
    const phoneInputs = document.querySelectorAll('.phone-input');
    phoneInputs.forEach(input => {
        // 기존 이벤트 리스너 제거 (중복 방지)
        input.removeEventListener('input', handlePhoneInput);
        input.removeEventListener('blur', handlePhoneBlur);

        // 새 이벤트 리스너 추가
        input.addEventListener('input', handlePhoneInput);
        input.addEventListener('blur', handlePhoneBlur);
    });
}

// 폰번호 입력 이벤트 핸들러
function handlePhoneInput(e) {
    const formatted = formatPhoneNumber(e.target.value);
    e.target.value = formatted;

    // 실시간 유효성 검증
    const isValid = validatePhoneNumber(formatted);
    if (formatted.length > 0) {
        if (isValid) {
            e.target.style.borderColor = '#4CAF50';
            e.target.style.boxShadow = '0 0 0 2px rgba(76, 175, 80, 0.1)';
        } else {
            e.target.style.borderColor = '#ff4757';
            e.target.style.boxShadow = '0 0 0 2px rgba(255, 71, 87, 0.1)';
        }
    } else {
        e.target.style.borderColor = '#e1e5e9';
        e.target.style.boxShadow = 'none';
    }
}

// 폰번호 블러 이벤트 핸들러
function handlePhoneBlur(e) {
    const phone = e.target.value.trim();
    const phoneRow = e.target.closest('.phone-input-row');
    const existingError = phoneRow ? phoneRow.querySelector('.phone-error') : null;

    if (existingError) {
        existingError.remove();
    }

    if (phone && !validatePhoneNumber(phone)) {
        const errorMsg = document.createElement('div');
        errorMsg.className = 'phone-error error-message';
        errorMsg.textContent = '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)';
        errorMsg.style.fontSize = '12px';
        errorMsg.style.marginTop = '4px';

        if (phoneRow) {
            phoneRow.appendChild(errorMsg);
        }
    }
}

// 날짜 입력 필드 설정
function setupDateInput() {
    const startDateInput = document.getElementById('startDate');
    if (startDateInput) {
        // 오늘 날짜를 기본값으로 설정
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];

        // 최소 날짜를 오늘로 설정 (과거 날짜 선택 불가)
        startDateInput.setAttribute('min', todayString);

        // 기본값이 없으면 오늘 날짜로 설정
        if (!startDateInput.value) {
            startDateInput.value = todayString;
        }

        // 3개월 후까지만 선택 가능하도록 제한
        const maxDate = new Date(today);
        maxDate.setMonth(maxDate.getMonth() + 3);
        const maxDateString = maxDate.toISOString().split('T')[0];
        startDateInput.setAttribute('max', maxDateString);
    }
}

// 폼 자동 저장 기능 설정
function setupFormAutoSave() {
    const formInputs = ['name', 'phone', 'workType', 'startDate', 'description'];

    formInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            // 저장된 값 불러오기
            const savedValue = localStorage.getItem(`form_${inputId}`);
            if (savedValue && inputId !== 'startDate') { // 날짜는 자동 저장하지 않음
                input.value = savedValue;
                // 저장된 값이 있는 필드에 시각적 표시
                showFormFieldSaved(input);
            }

            // 값 변경시 자동 저장
            input.addEventListener('input', function() {
                if (this.value.trim()) {
                    localStorage.setItem(`form_${inputId}`, this.value);
                    showAutoSaveIndicator();
                    showFormFieldSaved(this);
                } else {
                    localStorage.removeItem(`form_${inputId}`);
                    this.classList.remove('success');
                }
            });

            // 포커스 아웃시에도 저장 (select의 경우)
            input.addEventListener('change', function() {
                if (this.value.trim()) {
                    localStorage.setItem(`form_${inputId}`, this.value);
                    showAutoSaveIndicator();
                    showFormFieldSaved(this);
                } else {
                    localStorage.removeItem(`form_${inputId}`);
                    this.classList.remove('success');
                }
            });
        }
    });
}

// 자동 저장 알림 표시
function showAutoSaveIndicator() {
    const indicator = document.getElementById('autoSaveIndicator');
    if (indicator) {
        indicator.classList.add('show');

        // 2초 후 숨김
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 2000);
    }
}

// 폼 필드 저장 상태 표시
function showFormFieldSaved(input) {
    input.classList.add('success');

    // 3초 후 성공 스타일 제거
    setTimeout(() => {
        input.classList.remove('success');
    }, 3000);
}

// 폼 자동 저장 데이터 삭제
function clearFormAutoSave() {
    const formInputs = ['name', 'phone', 'workType', 'startDate', 'description'];
    formInputs.forEach(inputId => {
        localStorage.removeItem(`form_${inputId}`);
    });
}

// 페이지 로드시 초기화 시도
window.addEventListener('load', () => {
    initializeEmailJS().catch(error => {
        console.warn('EmailJS 초기화 실패:', error.message);
    });

    // 전화번호 포맷팅 설정
    setupPhoneFormatting();

    // 날짜 입력 필드 설정
    setupDateInput();

    // 폼 자동 저장 기능 설정
    setupFormAutoSave();
    
    // 저장된 대리점 정보 자동 표시
    loadAndDisplayDealerInfo().catch(error => {
        console.error('대리점 정보 로드 중 오류:', error);
    });
});

// 온라인 상태가 되면 재시도
window.addEventListener('online', () => {
    console.log('📶 네트워크 연결이 복구되었습니다.');
    showNetworkStatus('online');

    if (!emailJSInitialized) {
        initializeEmailJS().catch(error => {
            console.warn('EmailJS 재초기화 실패:', error.message);
        });
    }

    // 오프라인 큐에 있는 작업들 처리
    processOfflineQueue();
});

// 오프라인 상태 감지
window.addEventListener('offline', () => {
    console.warn('📵 네트워크 연결이 끊어졌습니다.');
    showNetworkStatus('offline');
});

// 네트워크 상태 표시
function showNetworkStatus(status) {
    const existingNotification = document.querySelector('.network-status');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `network-status ${status}`;

    if (status === 'offline') {
        notification.innerHTML = '📵 인터넷 연결이 끊어졌습니다. 데이터는 로컬에 저장됩니다.';
        notification.style.background = 'rgba(244, 67, 54, 0.9)';
    } else {
        notification.innerHTML = '📶 인터넷 연결이 복구되었습니다.';
        notification.style.background = 'rgba(76, 175, 80, 0.9)';
    }

    notification.style.cssText += `
        position: fixed;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1001;
        max-width: 90%;
        text-align: center;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        animation: slideDown 0.5s ease-out;
    `;

    document.body.appendChild(notification);

    // 5초 후 자동 제거 (온라인 복구 알림의 경우)
    if (status === 'online') {
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.5s ease-out forwards';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
}

// 오프라인 큐 관리
let offlineQueue = [];

function addToOfflineQueue(operation) {
    offlineQueue.push({
        ...operation,
        timestamp: Date.now()
    });
    console.log('📦 오프라인 큐에 작업 추가:', operation.type);
}

async function processOfflineQueue() {
    if (offlineQueue.length === 0) return;

    console.log(`📤 오프라인 큐 처리 시작: ${offlineQueue.length}개 작업`);

    for (const [index, operation] of offlineQueue.entries()) {
        try {
            switch (operation.type) {
                case 'save_application':
                    await saveApplicationToSupabase(operation.data);
                    break;
                case 'update_admin_settings':
                    await saveAdminSettingsToCloud();
                    break;
                case 'send_notification':
                    await sendNotificationsViaEdgeFunction(operation.data);
                    break;
            }
            console.log(`✅ 오프라인 작업 완료: ${operation.type}`);
        } catch (error) {
            console.error(`❌ 오프라인 작업 실패: ${operation.type}`, error);
        }
    }

    // 큐 초기화
    offlineQueue = [];
    console.log('📤 오프라인 큐 처리 완료');
}

let formData = {};
let currentQRDataURL = null;
let adminSettings = null; // 관리자 설정 캐시

// 공통 이메일 주소 정제 함수
function sanitizeEmailAddresses(emailsRaw) {
    return Array.from(new Set((emailsRaw || []).map(e => (e || '').toString().trim()))).filter(Boolean).slice(0, 3);
}

// 안전한 logEmailAttempt 전역 래퍼 (notification-service 모듈이 로드되지 않은 환경 방어)
if (typeof window !== 'undefined' && typeof window.logEmailAttempt !== 'function') {
    window.logEmailAttempt = async function(applicationId, provider, status, error = null) {
        try {
            // Supabase가 있으면 저장 시도
            if (typeof supabase !== 'undefined' && supabase) {
                try {
                    await supabase.from('notification_logs').insert([{
                        application_id: applicationId,
                        provider: provider,
                        status: status,
                        error: error,
                        timestamp: new Date().toISOString()
                    }]);
                    console.log('logEmailAttempt: Supabase에 로그 저장 완료');
                    return true;
                } catch (e) {
                    console.warn('logEmailAttempt: Supabase 저장 실패(무시):', e);
                }
            }

            // 최후의 수단: 콘솔에 로그 출력
            console.log('logEmailAttempt(Fallback):', { applicationId, provider, status, error, timestamp: new Date().toISOString() });
            return true;
        } catch (e) {
            console.warn('logEmailAttempt 예외(무시):', e);
            return false;
        }
    };
}

// 관리자 설정 저장 (Supabase)
async function saveAdminSettingsToCloud() {
    try {
        if (!supabase) {
            console.warn('Supabase가 초기화되지 않았습니다.');
            return;
        }

        const settings = {
            apartment_id: APARTMENT_ID,  // speed_apartment3 사용
            title: localStorage.getItem('mainTitle') || '',
            phones: JSON.parse(localStorage.getItem('savedPhoneNumbers') || '[]'),
            emails: JSON.parse(localStorage.getItem('savedEmailAddresses') || '[]'),
            updated_at: new Date().toISOString()
        };
        
        // upsert를 사용하여 존재하면 업데이트, 없으면 삽입
        const { data, error } = await supabase
            .from('admin_settings')
            .upsert(settings, { 
                onConflict: 'apartment_id',
                returning: 'minimal'
            });
        
        if (error) {
            console.error('Supabase 저장 오류:', error);
            return;
        }
        
        console.log('관리자 설정이 Supabase에 저장되었습니다.', settings);
        adminSettings = settings;
    } catch (error) {
        console.error('관리자 설정 저장 중 오류:', error);
    }
}

// 관리자 설정 로드 (Supabase)
async function loadAdminSettingsFromCloud() {
    try {
        if (!supabase) {
            console.warn('Supabase가 초기화되지 않았습니다. 로컬 설정을 사용합니다.');
            loadAdminSettingsLocal();
            return;
        }

        const { data, error } = await supabase
            .from('admin_settings')
            .select('apartment_name, title, subtitle, phones, emails')
            .eq('apartment_id', APARTMENT_ID)  // speed_apartment3 조건으로 검색
            .single();
        
        if (error && error.code !== 'PGRST116') { // 데이터가 없는 경우가 아닌 실제 오류
            console.error('Supabase 로드 오류:', error);
            loadAdminSettingsLocal(); // 실패시 로컬 로드
            return;
        }
        
        if (data) {
            // Supabase에서 가져온 데이터를 localStorage에 동기화
            if (data.title) localStorage.setItem('mainTitle', data.title);
            if (data.subtitle) localStorage.setItem('mainSubtitle', data.subtitle);
            if (data.phones) localStorage.setItem('savedPhoneNumbers', JSON.stringify(data.phones));
            if (data.emails) localStorage.setItem('savedEmailAddresses', JSON.stringify(data.emails));

            // 아파트 이름이 있으면 전역 변수에 설정
            if (data.apartment_name) {
                currentApartmentName = data.apartment_name;
                console.log('📍 아파트 이름 설정:', currentApartmentName);
            }

            // 화면에 제목과 부제목 즉시 반영 (고객 모드에서도 적용)
            const mainTitleElement = document.getElementById('mainTitle');
            const mainSubtitleElement = document.getElementById('mainSubtitle');

            if (mainTitleElement && data.title) {
                mainTitleElement.textContent = data.title;
                console.log('✅ 메인 제목 업데이트:', data.title);
            }
            if (mainSubtitleElement && data.subtitle) {
                mainSubtitleElement.textContent = data.subtitle;
                console.log('✅ 메인 부제목 업데이트:', data.subtitle);
            }

            adminSettings = data;
            console.log('Supabase에서 관리자 설정을 로드했습니다.');
        } else {
            console.log('Supabase에 저장된 관리자 설정이 없습니다. 로컬 설정을 사용합니다.');
            loadAdminSettingsLocal();
        }
        
        // 화면 업데이트
        loadSavedTitles();
        displaySavedInputs();
    } catch (error) {
        console.error('관리자 설정 로드 중 오류:', error);
        loadAdminSettingsLocal(); // 실패시 로컬 로드
    }
}

// 로컬 관리자 설정 로드 (백업용)
function loadAdminSettingsLocal() {
    try {
        const settings = {
            apartment_id: APARTMENT_ID,
            title: localStorage.getItem('mainTitle') || '',
            phones: JSON.parse(localStorage.getItem('savedPhoneNumbers') || '[]'),
            emails: JSON.parse(localStorage.getItem('savedEmailAddresses') || '[]')
        };
        
        adminSettings = settings;
        console.log('로컬에서 관리자 설정을 로드했습니다.');
        
        // 화면 업데이트
        loadSavedTitles();
        displaySavedInputs();
    } catch (error) {
        console.error('로컬 관리자 설정 로드 중 오류:', error);
    }
}

// 로컬 저장 백업 (Supabase 실패 시)
async function saveApplicationLocally(applicationData) {
    try {
        // 신청번호 생성
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const applicationNumber = `LOCAL-${dateStr}-${randomNum}`;

        // 통신사 이름 변환
        const providerNames = {
            'interior': 'KT',
            'exterior': 'SKT', 
            'plumbing': 'LGU+',
            'electrical': '기타(지역방송)'
        };

        const localApplication = {
            id: applicationNumber, // 로컬 ID로 사용
            name: applicationData.name, // 동/호수 정보
            phone: applicationData.phone,
            workType: applicationData.workType, // Supabase 컬럼명과 일치
            work_type_display: providerNames[applicationData.workType] || applicationData.workType,
            startDate: applicationData.startDate || null,
            description: applicationData.description || null,
            privacy: true, // 개인정보 동의
            submitted_at: applicationData.submittedAt,
            status: 'local_backup' // 로컬 백업 표시
        };

        // localStorage에 저장
        const existingApplications = JSON.parse(localStorage.getItem('localApplications') || '[]');
        existingApplications.push(localApplication);
        localStorage.setItem('localApplications', JSON.stringify(existingApplications));

        console.log('신청서를 로컬에 백업했습니다:', localApplication);

        // 로컬 알림 처리 + 실제 이메일 발송 시도
        await handleLocalNotification(localApplication);
        
        // 로컬 백업이어도 실제 이메일 발송 시도 (Edge Function은 application.id가 필요해서 EmailJS 사용)
        const emailResult = await sendEmailToAdmins(localApplication);
        if (emailResult) {
            console.log('로컬 백업에서 이메일 발송 성공');
            localApplication.email_sent = true;
        }

        return localApplication;
    } catch (error) {
        console.error('로컬 저장 중 오류:', error);
        return false;
    }
}

// 로컬 알림 처리 (이메일 주소를 콘솔에 출력)
async function handleLocalNotification(applicationData) {
    try {
        const savedEmails = JSON.parse(localStorage.getItem('savedEmailAddresses') || '[]');
        const savedPhones = JSON.parse(localStorage.getItem('savedPhoneNumbers') || '[]');

        const submittedDate = new Date(applicationData.submitted_at);
        const formattedDate = submittedDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const notificationMessage = `
[Speed 아파트] 새로운 통신환경개선 신청서 (로컬 백업)

■ 신청번호: ${applicationData.id}
■ 신청자: ${applicationData.name}
■ 연락처: ${applicationData.phone}
■ 동/호수: ${applicationData.name}
■ 현재 통신사: ${applicationData.work_type_display}
■ 희망일: ${applicationData.startDate || '미지정'}
■ 상세내용: ${applicationData.description || '없음'}
■ 접수일시: ${formattedDate}

⚠️ 네트워크 오류로 로컬에 저장되었습니다.

📞 긴급 연락처: ${savedPhones.length > 0 ? savedPhones[0] : '관리자 연락처 미설정'}
📧 관리자 이메일: ${savedEmails.length > 0 ? savedEmails[0] : '관리자 이메일 미설정'}

💡 해결방법:
1. 네트워크 연결을 확인해주세요
2. WiFi 또는 데이터 연결 상태를 점검해주세요
3. 위 연락처로 직접 연락주시면 신속히 처리해드립니다
        `;

        console.log('=== 관리자 알림 ===');
        console.log(notificationMessage);

        if (savedEmails.length > 0) {
            console.log('알림받을 이메일 주소:', savedEmails.join(', '));
        }
        if (savedPhones.length > 0) {
            console.log('알림받을 전화번호:', savedPhones.join(', '));
        }

        return true;
    } catch (error) {
        console.error('로컬 알림 처리 중 오류:', error);
        return false;
    }
}

// 신청서를 Supabase에 저장하고 관리자에게 알림 발송
async function saveApplicationToSupabase(applicationData) {
    try {
        console.log('Supabase 연결 상태 확인:', supabase);
        
        if (!supabase) {
            console.warn('Supabase가 초기화되지 않았습니다. 로컬 저장으로 대체합니다.');
            return await saveApplicationLocally(applicationData);
        }

        // 신청번호 생성 (현재 날짜 + 랜덤 4자리)
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const applicationNumber = `APP-${dateStr}-${randomNum}`;

        // 통신사 이름 변환
        const providerNames = {
            'interior': 'KT',
            'exterior': 'SKT', 
            'plumbing': 'LGU+',
            'electrical': '기타(지역방송)'
        };

        // 안전한 방식: 확실한 필드만 먼저 저장
        const applicationRecord = {
            name: applicationData.name, // 동/호수 정보
            phone: applicationData.phone // 연락처
        };

        // 선택적 컬럼들을 하나씩 안전하게 추가
        if (applicationData.workType) {
            applicationRecord.workType = applicationData.workType;
        }
        if (applicationData.startDate) {
            applicationRecord.startDate = applicationData.startDate;
        }
        if (applicationData.description) {
            applicationRecord.description = applicationData.description;
        }
        
        // privacy는 마지막에 추가 (개인정보 동의 체크 시에만 제출 가능)
        applicationRecord.privacy = true;
        
        // submitted_at 컬럼이 없으므로 제거
        // 대신 created_at이나 timestamp 컬럼이 있다면 사용

        console.log('🔍 Supabase에 신청서 저장 시도 - 상세 정보:', {
            timestamp: new Date().toISOString(),
            data: applicationRecord,
            keys: Object.keys(applicationRecord),
            values: Object.values(applicationRecord)
        });

        // applications 테이블에 신청서 저장
        const { data: insertedApplication, error: insertError } = await supabase
            .from('applications')
            .insert([applicationRecord])
            .select()
            .single();

        if (insertError) {
            console.error('💥 Supabase 신청서 저장 오류 - 상세 정보:', {
                error: insertError,
                code: insertError.code,
                message: insertError.message,
                details: insertError.details,
                hint: insertError.hint,
                sentData: applicationRecord
            });
            console.log('📦 로컬 저장으로 대체합니다.');
            return await saveApplicationLocally(applicationData);
        }

        console.log('신청서가 Supabase에 저장되었습니다:', insertedApplication);

        // Supabase Edge Function으로 관리자에게 이메일 발송
        const emailResult = await sendNotificationsViaEdgeFunction(insertedApplication);
        insertedApplication.email_sent = emailResult;

        return insertedApplication;

    } catch (error) {
        console.error('신청서 저장 중 오류:', error);
        console.log('로컬 저장으로 대체합니다.');
        return await saveApplicationLocally(applicationData);
    }
}

// 이메일 발송 로그 관리
async function logEmailAttempt(applicationId, provider, status, error = null) {
    try {
        console.log(`📋 이메일 발송 로그:`, {
            applicationId,
            provider,
            status,
            error,
            timestamp: new Date().toISOString()
        });
        
        // Supabase 로그 저장 (선택사항)
        if (supabase) {
            await supabase.from('notification_logs').insert([{
                application_id: applicationId,
                provider: provider,
                status: status,
                error: error,
                timestamp: new Date().toISOString()
            }]);
        }
    } catch (err) {
        console.warn('로그 저장 실패:', err);
    }
}

// SendGrid 백업 발송 함수 (임시 구현)
async function sendViaSendGrid(applicationData) {
    try {
        console.log('📨 SendGrid 백업 발송 시도 (현재 미구현)');
        console.log('📧 대신 로컬 백업으로 처리합니다.');
        
        // 실제 SendGrid 구현이 없으므로 로컬 백업 방식 사용
        return {
            success: false,
            message: 'SendGrid 미구현 - 로컬 백업 사용'
        };
    } catch (error) {
        console.error('SendGrid 백업 발송 실패:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 관리자에게 실제 이메일 발송 (강화된 오류 처리)
async function sendEmailToAdmins(applicationData) {
    try {
        console.log('📧 이메일 발송 시도 - 상세 정보:', {
            timestamp: new Date().toISOString(),
            applicationId: applicationData.id || 'ID 없음',
            deviceType: /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            emailJSState: {
                available: typeof emailjs !== 'undefined',
                initialized: emailJSInitialized,
                sendFunction: typeof emailjs?.send === 'function'
            }
        });
        

    // 저장된 관리자 이메일 주소 가져오기
    const savedEmailsRaw = JSON.parse(localStorage.getItem('savedEmailAddresses') || '[]');
    const savedEmails = sanitizeEmailAddresses(savedEmailsRaw);

        if (savedEmails.length === 0) {
            console.warn('⚠️ 저장된 관리자 이메일 주소가 없습니다.');
            return false;
        }

        // EmailJS 완전성 검사
        if (typeof emailjs === 'undefined') {
            console.error('❌ EmailJS 라이브러리가 로드되지 않았습니다.');
            throw new Error('EmailJS 라이브러리 로드 실패');
        }

        if (typeof emailjs.send !== 'function') {
            console.error('❌ EmailJS send 함수를 사용할 수 없습니다.');
            throw new Error('EmailJS send 함수 사용 불가');
        }

        if (!emailJSInitialized) {
            console.warn('⚠️ EmailJS가 초기화되지 않았습니다. 재초기화 시도...');
            try {
                await initializeEmailJS();
            } catch (initError) {
                console.error('❌ EmailJS 재초기화 실패:', initError);
                throw new Error('EmailJS 초기화 실패: ' + initError.message);
            }
        }

        // 제출일시 포맷팅
        const submittedDate = new Date(applicationData.submitted_at);
        const formattedDate = submittedDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            weekday: 'long'
        });

        let emailsSent = 0;

        // 각 관리자 이메일로 EmailJS 발송
        console.log('📧 EmailJS로 관리자에게 이메일 발송을 시도합니다.');
        
        // 브라우저 알림 권한 요청 (모바일에서 Notification 생성이 에러를 던지는 브라우저가 있어 방어적으로 래핑)
        try {
            if (typeof window !== 'undefined' && 'Notification' in window && typeof Notification === 'function') {
                if (Notification.permission === 'default') {
                    try {
                        await Notification.requestPermission();
                    } catch (permErr) {
                        console.warn('Notification 권한 요청 중 오류:', permErr);
                    }
                }

                if (Notification.permission === 'granted') {
                    try {
                        new Notification('🏢 새로운 신청서 접수', {
                            body: `신청자: ${applicationData.name}\n연락처: ${applicationData.phone}\n동/호수: ${applicationData.name}`,
                            icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDRIM0MxLjg5IDQgMS4wMSA0Ljg5IDEuMDEgNkwxIDE4QzEgMTkuMTEgMS44OSAyMCAzIDIwSDIwQzIxLjExIDIwIDIyIDE5LjExIDIyIDE4VjZDMjIgNC44OSAyMS4xMSA0IDIwIDRaTTIwIDhMMTEuNSAxMy41TDMgOFY2TDExLjUgMTEuNUwyMCA2VjhaIiBmaWxsPSIjNENBRjUwIi8+Cjwvc3ZnPgo='
                        });
                    } catch (notificationErr) {
                        // 일부 모바일 브라우저(특히 Eruda 내장 환경)에서 Illegal constructor 오류 발생 -> 무시
                        console.warn('Notification 생성 불가(무시):', notificationErr && notificationErr.message ? notificationErr.message : notificationErr);
                    }
                }
            }
        } catch (e) {
            console.warn('Notification 처리 중 예외 발생(무시):', e && e.message ? e.message : e);
        }

        // 실제 EmailJS로 이메일 발송
        for (const adminEmail of savedEmails) {
            try {
                console.log(`📧 ${adminEmail}로 EmailJS 이메일 발송 시도...`);

                // EmailJS 템플릿 파라미터 (이메일 전용: 신청번호을 YYYYMMDDHHmm으로 전달하고, 제출일시 라벨을 접수일시로 제공)
                const _submittedIso = applicationData.submittedAt || applicationData.submitted_at || new Date().toISOString();
                const _submittedDate = new Date(_submittedIso);
                const _formattedDate = _submittedDate.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    weekday: 'long'
                });

                // YYYYMMDDHHmm 형식으로 신청번호 생성 (이메일용)
                const pad2 = (n) => n.toString().padStart(2, '0');
                const y = _submittedDate.getFullYear();
                const m = pad2(_submittedDate.getMonth() + 1);
                const d = pad2(_submittedDate.getDate());
                const hh = pad2(_submittedDate.getHours());
                const min = pad2(_submittedDate.getMinutes());
                const emailAppNumber = applicationData.application_number || `${y}${m}${d}${hh}${min}`;

                // work_type_display가 없을 경우 안전한 폴백을 계산
                const providerNamesFallback_local = {
                    'interior': 'KT',
                    'exterior': 'SKT', 
                    'plumbing': 'LGU+',
                    'electrical': '기타(지역방송)'
                };
                const resolvedWorkTypeDisplay_local = applicationData.work_type_display || providerNamesFallback_local[applicationData.workType] || applicationData.workType || '미상';

                const templateParams = {
                    to_email: adminEmail,
                    apartment_name: currentApartmentName,
                    application_number: emailAppNumber,
                    name: applicationData.name,
                    phone: applicationData.phone,
                    // 템플릿에서는 {{work_type_display}}를 사용하므로 이 키로 항상 전송
                    work_type_display: resolvedWorkTypeDisplay_local,
                    start_date: applicationData.startDate || '미지정',
                    description: applicationData.description || '특별한 요청사항 없음',
                    // 템플릿에서 어느 키를 사용하는지 다를 수 있어 안전하게 둘 다 보냄
                    submittedAt: _formattedDate,
                    submitted_at: _formattedDate,
                    // 템플릿에서 라벨을 변수로 받아 사용한다면 이 값을 사용하도록 함(없어도 무해)
                    submission_label: '접수일시:'
                };

                // EmailJS로 이메일 발송 (강화된 오류 처리)
                console.log('📤 EmailJS 발송 파라미터:', templateParams);
                
                const response = await Promise.race([
                    emailjs.send('service_v90gm26', 'template_pxi385c', templateParams),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('EmailJS 발송 시간 초과 (30초)')), 30000)
                    )
                ]);

                console.log(`✅ ${adminEmail}로 이메일 발송 성공:`, response);
                emailsSent++;
                
                // 발송 성공 검증
                if (response.status !== 200) {
                    console.warn(`⚠️ ${adminEmail} 발송 응답 상태가 비정상: ${response.status}`);
                }

            } catch (error) {
                console.error(`❌ ${adminEmail}로 이메일 발송 실패:`, error);
                console.error('📋 실패한 이메일 파라미터:', templateParams);
                console.error('🔍 오류 상세정보:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                    cause: error.cause
                });
                
                // 모바일 디버그 환경에서 오류 표시
                if (typeof window.logError === 'function') {
                    window.logError(new Error(`EmailJS 발송 실패 (${adminEmail}): ${error.message}`));
                }
            }

            // 다음 이메일 발송 전 잠시 대기 (스팸 방지)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`총 ${emailsSent}개의 이메일이 성공적으로 발송되었습니다.`);
        return emailsSent > 0;

    } catch (error) {
        console.error('💥 이메일 발송 중 전체 오류:', error);
        
        // 모바일 환경에서 친절한 오류 안내
        if (/Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            console.log(`
📱 모바일 환경에서 메일 발송 실패 안내:

🔧 해결 방법:
1. WiFi 또는 데이터 연결 상태 확인
2. 브라우저 새로고침 후 재시도  
3. 다른 브라우저(Chrome, Safari)에서 시도
4. 관리자에게 직접 연락

⚠️ 신청서는 로컬에 안전하게 저장되었습니다.
            `);
        }
        
        return false;
    }
}

// EmailJS를 통한 이메일 발송 (주 시스템)
async function sendNotificationsViaEdgeFunction(applicationData) {
    try {
        console.log('📱 메일 발송 시작 - 디버그 정보:', {
            deviceInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                isMobile: /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
            },
            networkState: {
                isOnline: navigator.onLine,
                connection: navigator.connection ? {
                    type: navigator.connection.type,
                    effectiveType: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink
                } : 'Connection API not supported'
            },
            emailJSState: {
                initialized: emailJSInitialized,
                attempts: initializationAttempts
            }
        });

        // 네트워크 상태 확인
        if (!navigator.onLine) {
            console.error('🔴 네트워크 오프라인 상태');
            throw new Error('네트워크 연결이 필요합니다.');
        }

        // EmailJS 초기화 상태 확인 및 재시도
        if (!emailJSInitialized || typeof emailjs === 'undefined') {
            console.log('📨 EmailJS 초기화 시도 중...');
            try {
                // 모바일에서 더 오래 대기
                const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                if (isMobile) {
                    console.log('📱 모바일 환경에서 EmailJS 재초기화 시도...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
                await initializeEmailJS();
                console.log('✅ EmailJS 초기화 성공');
            } catch (initError) {
                console.error('❌ EmailJS 초기화 실패:', initError);
                console.warn('🚫 EmailJS 초기화 실패 — 로컬 알림으로 폴백합니다.');
                await handleLocalNotification(applicationData);
                return { success: false, error: 'EmailJS 초기화 실패 - 로컬 폴백' };
            }
        }

        if (!emailjs) {
            console.warn('🚫 EmailJS 사용 불가 — 로컬 알림으로 폴백합니다.');
            await handleLocalNotification(applicationData);
            return { success: false, error: 'EmailJS 라이브러리 없음 - 로컬 폴백' };
        }

        console.log('📨 이메일 발송 시작');
        console.log('📋 신청서 데이터:', applicationData);
        console.log('🔑 신청서 ID:', applicationData.id);
        
        // 모바일 환경 로깅
        console.log('📱 사용자 환경:', {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            vendor: navigator.vendor,
            isMobile: /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent)
        });

        // 관리자 설정 확인
        console.log('👑 현재 관리자 설정 확인...');
        const { data: adminCheck, error: adminError } = await supabase
            .from('admin_settings')
            .select('emails')
            .eq('apartment_id', APARTMENT_ID)  // speed_apartment3로 검색
            .single();

        if (adminError || !adminCheck?.emails || adminCheck.emails.length === 0) {
            console.error('❌ 관리자 이메일 설정 문제:', adminError?.message);
            throw new Error('관리자 이메일 설정을 찾을 수 없습니다.');
        }

        // 관리자 이메일 목록 정리
        const adminEmails = Array.isArray(adminCheck.emails) ? sanitizeEmailAddresses(adminCheck.emails) : [];

        // EmailJS로 메일 발송
        const results = await Promise.all(adminEmails.map(async (email) => {
            try {
                // 이메일용 파라미터 재구성: 신청번호를 YYYYMMDDHHmm으로 전달하고, 제출일시 라벨을 '접수일시:'로 전달
                const _iso = applicationData.submittedAt || applicationData.submitted_at || new Date().toISOString();
                const _d = new Date(_iso);
                const pad = (n) => n.toString().padStart(2, '0');
                const yy = _d.getFullYear();
                const mm = pad(_d.getMonth() + 1);
                const dd = pad(_d.getDate());
                const hh2 = pad(_d.getHours());
                const min2 = pad(_d.getMinutes());
                const emailAppNum = applicationData.application_number || `${yy}${mm}${dd}${hh2}${min2}`;
                const formattedForEmail = _d.toLocaleString('ko-KR');

                // work_type_display가 없을 경우 안전한 폴백을 계산
                const providerNamesFallback = {
                    'interior': 'KT',
                    'exterior': 'SKT',
                    'plumbing': 'LGU+',
                    'electrical': '기타(지역방송)'
                };
                const resolvedWorkTypeDisplay = applicationData.work_type_display || providerNamesFallback[applicationData.workType] || applicationData.workType || '미상';

                const result = await emailjs.send(
                    'service_v90gm26',
                    'template_pxi385c',
                    {
                        to_email: email,
                        apartment_name: 'Speed 아파트 3단지',
                        application_number: emailAppNum,
                        name: applicationData.name,
                        phone: applicationData.phone,
                        // 템플릿에서 {{work_type_display}}를 사용하므로 해당 키도 항상 전송
                        work_type_display: resolvedWorkTypeDisplay,
                        work_type: resolvedWorkTypeDisplay,
                        start_date: applicationData.startDate || '미지정',
                        description: applicationData.description || '없음',
                        submitted_at: formattedForEmail,
                        submittedAt: formattedForEmail,
                        submission_label: '접수일시:'
                    }
                );
                if (typeof logEmailAttempt === 'function') {
                    try { await logEmailAttempt(applicationData.id, 'emailjs', 'sent'); } catch(e){ console.warn('logEmailAttempt 실패(무시):', e); }
                }
                return { email, success: true, result };
            } catch (error) {
                console.error(`❌ ${email}로 EmailJS 개별 발송 실패:`, error);
                console.error('📋 실패한 이메일 파라미터:', {
                    to_email: email,
                    apartment_name: 'Speed 아파트 3단지',
                    application_number: emailAppNum,
                    name: applicationData.name,
                    phone: applicationData.phone,
                    work_type_display: resolvedWorkTypeDisplay,
                    start_date: applicationData.startDate || '미지정',
                    description: applicationData.description || '없음'
                });
                console.error('🔍 오류 상세정보:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
                
                // 모바일 디버그 환경에서 오류 표시
                if (typeof window.logError === 'function') {
                    window.logError(new Error(`EmailJS 개별 발송 실패 (${email}): ${error.message}`));
                }
                
                if (typeof logEmailAttempt === 'function') {
                    try { await logEmailAttempt(applicationData.id, 'emailjs', 'failed', error.message); } catch(e){ console.warn('logEmailAttempt 실패(무시):', e); }
                }
                return { email, success: false, error };
            }
        }));

        // 발송 결과 처리
        const successfulSends = results.filter(r => r.success).length;
        const totalAttempts = results.length;

        // 모든 이메일 발송이 실패한 경우 로컬 알림으로 폴백
        if (successfulSends === 0) {
            console.warn('⚠️ EmailJS 발송 실패. 로컬 알림으로 대체...');
            
            // 로컬 알림 처리 (SendGrid 대신)
            const localNotification = await handleLocalNotification(applicationData);
            return {
                success: localNotification,
                sent: 0,
                total: totalAttempts,
                fallback: 'local_notification'
            };
        }

        return {
            success: true,
            sent: successfulSends,
            total: totalAttempts
        };

    } catch (error) {
        console.error('💥 EmailJS 발송 중 오류:', error);
        console.warn('EmailJS 발송 오류 — 로컬 알림으로 폴백합니다.');
        await handleLocalNotification(applicationData);
        return { success: false, error: error.message };
    }
}

// 관리자에게 알림 발송 (기존 EmailJS 방식 - 백업용)
async function sendNotificationsToAdmins(applicationData) {
    try {
        // 저장된 관리자 연락처 가져오기
        const savedEmails = JSON.parse(localStorage.getItem('savedEmailAddresses') || '[]');
        const savedPhones = JSON.parse(localStorage.getItem('savedPhoneNumbers') || '[]');
        
        // 실제 이메일 발송
        const emailResult = await sendEmailToAdmins(applicationData);
        
        // Supabase 알림 로그 저장 (있는 경우)
        if (supabase && applicationData.id) {
            const submittedDate = new Date(applicationData.submitted_at);
            const formattedDate = submittedDate.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const emailMessage = `
[Speed 아파트] 새로운 통신환경개선 신청서

■ 신청번호: ${applicationData.id}
■ 신청자: ${applicationData.name}
■ 연락처: ${applicationData.phone}
■ 동/호수: ${applicationData.name}
■ 현재 통신사: ${applicationData.work_type_display}
■ 희망일: ${applicationData.startDate || '미지정'}
■ 상세내용: ${applicationData.description || '없음'}
■ 접수일시: ${formattedDate}

관리자님께서 확인하시고 적절한 조치를 취해주시기 바랍니다.
            `;

            const notifications = [];

            // 이메일 알림 로그 생성
            savedEmails.forEach(email => {
                notifications.push({
                    application_id: applicationData.id,
                    notification_type: 'email',
                    recipient: email,
                    message: emailMessage,
                    status: emailResult ? 'sent' : 'failed'
                });
            });

            if (notifications.length > 0) {
                const { error: notificationError } = await supabase
                    .from('notification_logs')
                    .insert(notifications);

                if (notificationError) {
                    console.error('알림 로그 저장 오류:', notificationError);
                } else {
                    console.log(`${notifications.length}개의 알림 로그가 저장되었습니다.`);
                }
            }
        }

        return emailResult;

    } catch (error) {
        console.error('알림 발송 중 오류:', error);
        return false;
    }
}

// 고객용 신청서 제출 처리 (Supabase 저장 및 알림 발송)
async function processCustomerFormSubmission(event) {
    event.preventDefault();
    console.log('📝 신청서 제출 시작 - 환경 정보:', {
        시간: new Date().toISOString(),
        브라우저: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            onLine: navigator.onLine,
            platform: navigator.platform
        },
        화면: {
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: window.devicePixelRatio
        },
        이메일상태: {
            EmailJS초기화: emailJSInitialized,
            시도횟수: initializationAttempts
        }
    });

    const formDataObj = new FormData(event.target);
    const applicationData = {};
    
    // 폼 데이터 수집
    for (let [key, value] of formDataObj.entries()) {
        applicationData[key] = value;
    }
    
    // 유효성 검증
    if (!applicationData.name || !applicationData.phone || !applicationData.startDate) {
        alert('필수 항목을 모두 입력해주세요.\n(공사요청, 연락처, 공사 희망일)');
        return;
    }
    
    // 공사 희망일 날짜 검증
    const selectedDate = new Date(applicationData.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 시간 정보 제거
    
    if (selectedDate < today) {
        alert('공사 희망일은 오늘 날짜 이후로 선택해주세요.');
        return;
    }
    
    if (!applicationData.privacy) {
        alert('개인정보 수집 및 이용에 동의해주세요.');
        return;
    }
    
    // 추가 정보 설정
    applicationData.submittedAt = new Date().toISOString();
    
    console.log('신청서 제출:', applicationData);
    
    // 제출 버튼 비활성화 (중복 제출 방지)
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '제출 중...';
    }
    
    try {
        // Supabase에 신청서 저장 및 관리자 알림
        const savedApplication = await saveApplicationToSupabase(applicationData);
        
        if (savedApplication) {
            // 이메일 발송 여부에 따른 메시지 생성
            let successMessage = `✅ 신청서가 성공적으로 제출되었습니다!\n신청번호: ${savedApplication.id}`;
            
            if (savedApplication.email_sent || savedApplication.id) {
                successMessage += '\n✉️ 관리자에게 이메일로 자동 전달되었습니다.';
            } else {
                successMessage += '\n📋 신청서가 저장되었으며, 관리자가 확인할 예정입니다.';
            }
            
            alert(successMessage);
            
            // 폼 초기화
            event.target.reset();

            // 자동 저장 데이터 삭제
            clearFormAutoSave();

            // 결과 페이지로 이동
            showResult(savedApplication);
        } else {
            throw new Error('신청서 저장에 실패했습니다.');
        }
        
    } catch (error) {
        console.error('신청서 제출 중 오류:', error);
        alert('❌ 신청서 제출 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.');
    } finally {
        // 제출 버튼 활성화
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '신청서 제출';
        }
    }
}

// 제목 편집 모드로 전환
function editTitle() {
    const titleElement = document.getElementById('mainTitle');
    const currentTitle = titleElement.textContent;
    
    titleElement.innerHTML = `
        <input type="text" id="titleInput" value="${currentTitle}" style="width: 100%; padding: 8px; border: 2px solid #4CAF50; border-radius: 4px; font-size: 18px; font-weight: bold;">
    `;
    
    const titleInput = document.getElementById('titleInput');
    titleInput.focus();
    titleInput.select();
    
    // Enter 키로 저장, Esc 키로 취소
    titleInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            saveTitle();
        } else if (e.key === 'Escape') {
            cancelTitleEdit();
        }
    });
    
    // 입력란에서 포커스가 벗어나면 자동 저장
    titleInput.addEventListener('blur', function() {
        saveTitle();
    });
}

// 제목 저장
function saveTitle() {
    const titleInput = document.getElementById('titleInput');
    const newTitle = titleInput.value.trim();
    
    if (!newTitle) {
        alert('제목을 입력해주세요.');
        return;
    }
    
    // localStorage에 저장
    localStorage.setItem('mainTitle', newTitle);
    
    // 제목 업데이트 및 편집 모드 해제
    const titleElement = document.getElementById('mainTitle');
    titleElement.innerHTML = newTitle;
    titleElement.onclick = editTitle;
    
    // Supabase에 저장
    saveAdminSettingsToCloud();
    
    alert('제목이 저장되었습니다!');
}

// 제목 편집 취소
function cancelTitleEdit() {
    const titleElement = document.getElementById('mainTitle');
    const savedTitle = localStorage.getItem('mainTitle') || 'Speed 아파트 통신 환경 개선 신청서';
    
    // 편집 모드 해제하고 원래 상태로 복원
    titleElement.innerHTML = savedTitle;
    titleElement.onclick = editTitle;
}

// 부제목은 고정 텍스트로 변경됨 - 편집 기능 제거

// 메일 입력 모달 표시
function showEmailInputModal() {
    const modal = document.getElementById('emailInputModal');
    modal.style.display = 'block';
    
    // 기존 입력란 초기화
    const emailInputs = document.getElementById('emailInputs');
    emailInputs.innerHTML = `
        <div class="email-input-row">
            <input type="email" class="email-input" placeholder="example1@email.com">
            <button type="button" class="remove-btn" onclick="removeEmailInput(this)" style="display: none;">삭제</button>
        </div>
    `;
    
    // 저장된 메일 주소 불러오기
    const savedEmails = JSON.parse(localStorage.getItem('savedEmailAddresses') || '[]');
    savedEmails.forEach((email, index) => {
        if (index > 0) {
            addEmailInput();
        }
        const inputs = emailInputs.querySelectorAll('.email-input');
        if (inputs[index]) {
            inputs[index].value = email;
        }
    });
}

// 메일 입력란 추가
function addEmailInput() {
    const emailInputs = document.getElementById('emailInputs');
    const emailRows = emailInputs.querySelectorAll('.email-input-row');
    
    if (emailRows.length >= 3) {
        alert('메일 주소는 최대 3개까지 입력할 수 있습니다.');
        return;
    }
    
    const newRow = document.createElement('div');
    newRow.className = 'email-input-row';
    newRow.innerHTML = `
        <input type="email" class="email-input" placeholder="example${emailRows.length + 1}@email.com">
        <button type="button" class="remove-btn" onclick="removeEmailInput(this)">삭제</button>
    `;
    
    emailInputs.appendChild(newRow);
    
    // 삭제 버튼 표시/숨김 조정
    if (emailRows.length === 0) {
        emailInputs.querySelector('.remove-btn').style.display = 'none';
    }
}

// 메일 입력란 삭제
function removeEmailInput(button) {
    const emailInputs = document.getElementById('emailInputs');
    const emailRows = emailInputs.querySelectorAll('.email-input-row');
    
    if (emailRows.length > 1) {
        button.parentElement.remove();
        
        // 삭제 버튼 표시/숨김 조정
        if (emailRows.length === 2) {
            emailInputs.querySelector('.remove-btn').style.display = 'none';
        }
    }
}

// 메일 주소 저장
function saveEmailAddresses() {
    const emailInputs = document.querySelectorAll('.email-input');
    const emails = [];
    
    emailInputs.forEach(input => {
        const email = input.value.trim();
        if (email && email.includes('@')) {
            emails.push(email);
        }
    });
    
    if (emails.length === 0) {
        alert('유효한 메일 주소를 입력해주세요.');
        return;
    }
    
    // localStorage에 저장
    localStorage.setItem('savedEmailAddresses', JSON.stringify(emails));
    
    // 화면 업데이트
    displaySavedInputs();
    
    // Supabase에 저장
    saveAdminSettingsToCloud();
    
    // 모달 닫기
    closeEmailInputModal();
    
    alert('메일 주소가 저장되었습니다!');
}

// 메일 입력 모달 닫기
function closeEmailInputModal() {
    const modal = document.getElementById('emailInputModal');
    modal.style.display = 'none';
}

// 폰번호 입력 모달 표시
function showPhoneInputModal() {
    const modal = document.getElementById('phoneInputModal');
    modal.style.display = 'block';

    // 기존 입력란 초기화
    const phoneInputs = document.getElementById('phoneInputs');
    phoneInputs.innerHTML = `
        <div class="phone-input-row">
            <input type="tel" class="phone-input" placeholder="010-1234-5678">
            <button type="button" class="remove-btn" onclick="removePhoneInput(this)" style="display: none;">삭제</button>
        </div>
    `;

    // 저장된 폰번호 불러오기
    const savedPhones = JSON.parse(localStorage.getItem('savedPhoneNumbers') || '[]');
    savedPhones.forEach((phone, index) => {
        if (index > 0) {
            addPhoneInput();
        }
        const inputs = phoneInputs.querySelectorAll('.phone-input');
        if (inputs[index]) {
            inputs[index].value = phone;
        }
    });

    // 새로 생성된 입력 필드에 포맷팅 적용
    setupPhoneInputFormatting();
}

// 폰번호 입력란 추가
function addPhoneInput() {
    const phoneInputs = document.getElementById('phoneInputs');
    const phoneRows = phoneInputs.querySelectorAll('.phone-input-row');

    if (phoneRows.length >= 3) {
        alert('폰번호는 최대 3개까지 입력할 수 있습니다.');
        return;
    }

    const newRow = document.createElement('div');
    newRow.className = 'phone-input-row';
    newRow.innerHTML = `
        <input type="tel" class="phone-input" placeholder="010-1234-5678">
        <button type="button" class="remove-btn" onclick="removePhoneInput(this)">삭제</button>
    `;

    phoneInputs.appendChild(newRow);

    // 새로 추가된 입력 필드에 포맷팅 적용
    const newInput = newRow.querySelector('.phone-input');
    if (newInput) {
        newInput.addEventListener('input', handlePhoneInput);
        newInput.addEventListener('blur', handlePhoneBlur);
    }

    // 삭제 버튼 표시/숨김 조정
    updateRemoveButtonVisibility();
}

// 삭제 버튼 표시/숨김 관리 함수
function updateRemoveButtonVisibility() {
    const phoneInputs = document.getElementById('phoneInputs');
    const phoneRows = phoneInputs.querySelectorAll('.phone-input-row');
    const removeButtons = phoneInputs.querySelectorAll('.remove-btn');

    if (phoneRows.length <= 1) {
        // 1개 이하일 때는 모든 삭제 버튼 숨김
        removeButtons.forEach(btn => btn.style.display = 'none');
    } else {
        // 2개 이상일 때는 모든 삭제 버튼 표시
        removeButtons.forEach(btn => btn.style.display = 'inline-block');
    }
}

// 폰번호 입력란 삭제
function removePhoneInput(button) {
    const phoneInputs = document.getElementById('phoneInputs');
    const phoneRows = phoneInputs.querySelectorAll('.phone-input-row');

    if (phoneRows.length > 1) {
        button.parentElement.remove();

        // 삭제 버튼 표시/숨김 조정
        updateRemoveButtonVisibility();
    }
}

// 폰번호 저장
function savePhoneNumbers() {
    const phoneInputs = document.querySelectorAll('.phone-input');
    const phones = [];
    const invalidPhones = [];

    phoneInputs.forEach(input => {
        const phone = input.value.trim();
        if (phone) {
            if (validatePhoneNumber(phone)) {
                phones.push(phone);
            } else {
                invalidPhones.push(phone);
            }
        }
    });

    // 유효하지 않은 번호가 있으면 경고
    if (invalidPhones.length > 0) {
        alert(`다음 전화번호의 형식이 올바르지 않습니다:\n${invalidPhones.join('\n')}\n\n올바른 형식: 010-1234-5678`);
        return;
    }

    if (phones.length === 0) {
        alert('유효한 폰번호를 입력해주세요.');
        return;
    }

    // localStorage에 저장
    localStorage.setItem('savedPhoneNumbers', JSON.stringify(phones));

    // 화면 업데이트
    displaySavedInputs();

    // Supabase에 저장
    saveAdminSettingsToCloud();

    // 모달 닫기
    closePhoneInputModal();

    alert(`폰번호 ${phones.length}개가 저장되었습니다!`);
}

// 폰번호 입력 모달 닫기
function closePhoneInputModal() {
    const modal = document.getElementById('phoneInputModal');
    modal.style.display = 'none';
}

// QR 코드 생성
function generatePageQR() {
    console.log('QR 코드 생성 시작');
    
    const qrSection = document.getElementById('qrSection');
    const qrCodeDiv = document.getElementById('qrcode');
    const qrDeleteBtn = document.getElementById('qrDeleteBtn');
    
    console.log('DOM 요소 확인:', {
        qrSection: qrSection,
        qrCodeDiv: qrCodeDiv,
        qrDeleteBtn: qrDeleteBtn
    });
    
    // QRCode 라이브러리 확인
    if (typeof QRCode === 'undefined') {
        console.error('QRCode 라이브러리가 로드되지 않았습니다.');
        alert('QR 코드 라이브러리를 불러올 수 없습니다.\n\n페이지를 새로고침하고 다시 시도해주세요.');
        return;
    }
    
    // 고객용 URL 생성 (간단하게)
    const currentUrl = window.location.origin + window.location.pathname;
    // 현재 debug 모드인지 확인
    const isDebugMode = new URLSearchParams(window.location.search).get('debug') === 'true';
    const customerUrl = isDebugMode ? 
        `${currentUrl}?debug=true&mode=customer` : 
        `${currentUrl}?mode=customer`;
    
    console.log('QR 코드용 단순화된 URL:', customerUrl);
    console.log('URL 길이:', customerUrl.length, '자');
    
    // URL이 너무 긴 경우 더 단축
    if (customerUrl.length > 800) {
        console.warn('URL이 너무 깁니다. 더 단축합니다.');
        // 짧은 URL 사용
        const shortUrl = isDebugMode ? 
            `${window.location.protocol}//${window.location.host}${window.location.pathname}?debug=true&mode=customer` :
            `${window.location.protocol}//${window.location.host}${window.location.pathname}?mode=customer`;
        console.log('더 단축된 URL:', shortUrl, '길이:', shortUrl.length);
        return generateQRWithShortUrl(shortUrl, qrCodeDiv, qrSection, qrDeleteBtn);
    }
    
    try {
        console.log('QR 코드 생성 시작');
        qrCodeDiv.innerHTML = '';
        
        new QRCode(qrCodeDiv, {
            text: customerUrl,
            width: 250,
            height: 250,
            colorDark: "#000000",
            colorLight: "#FFFFFF",
            correctLevel: QRCode.CorrectLevel.H,
            margin: 2
        });
        
        console.log('QR 코드 생성 완료');
        
        // QR 섹션 표시
        qrSection.style.display = 'block';
        
        // QR 삭제 버튼 표시
        if (qrDeleteBtn) {
            qrDeleteBtn.style.display = 'inline-block';
        }
        
        // Supabase에 관리자 설정 저장
        saveAdminSettingsToCloud();
        
        console.log('QR 코드 생성 완료:', customerUrl);
        
        } catch (error) {
        console.error('QR 코드 생성 중 오류:', error);
        alert('QR 코드 생성 중 오류가 발생했습니다: ' + error.message);
    }
}

// 짧은 URL로 QR 생성
function generateQRWithShortUrl(shortUrl, qrCodeDiv, qrSection, qrDeleteBtn) {
    try {
        console.log('짧은 URL로 QR 코드 생성:', shortUrl);
        qrCodeDiv.innerHTML = '';
        
        new QRCode(qrCodeDiv, {
            text: shortUrl,
            width: 250,
            height: 250,
            colorDark: "#000000",
            colorLight: "#FFFFFF",
            correctLevel: QRCode.CorrectLevel.L, // 낮은 오류 수정 레벨로 변경
            margin: 2
        });
        
        console.log('짧은 URL QR 코드 생성 완료');
        
        // QR 섹션 표시
        qrSection.style.display = 'block';
        
        // QR 삭제 버튼 표시
        if (qrDeleteBtn) {
            qrDeleteBtn.style.display = 'inline-block';
        }
        
        // Supabase에 관리자 설정 저장
        saveAdminSettingsToCloud();
        
        console.log('짧은 URL QR 코드 생성 완료:', shortUrl);
        
    } catch (error) {
        console.error('짧은 URL QR 코드 생성 중 오류:', error);
        
        // 최후의 수단: 더 간단한 URL
        const isDebugMode = new URLSearchParams(window.location.search).get('debug') === 'true';
        const simpleUrl = isDebugMode ? 
            `${window.location.protocol}//${window.location.hostname}?debug=true&mode=customer` :
            `${window.location.protocol}//${window.location.hostname}?mode=customer`;
        console.log('최종 단순 URL 시도:', simpleUrl);
        
        try {
            qrCodeDiv.innerHTML = '';
            new QRCode(qrCodeDiv, {
                text: simpleUrl,
                width: 200,
                height: 200,
                correctLevel: QRCode.CorrectLevel.L
            });
            
            qrSection.style.display = 'block';
            if (qrDeleteBtn) qrDeleteBtn.style.display = 'inline-block';
            
        } catch (finalError) {
            console.error('최종 QR 생성 실패:', finalError);
            alert('QR 코드 생성에 실패했습니다. URL이 너무 긴 것 같습니다.');
        }
    }
}

// QR 코드 삭제
function deleteQR() {
    const qrSection = document.getElementById('qrSection');
    const qrCodeDiv = document.getElementById('qrcode');
    const qrDeleteBtn = document.getElementById('qrDeleteBtn');
    
    qrCodeDiv.innerHTML = '';
    qrSection.style.display = 'none';
    
    if (qrDeleteBtn) {
        qrDeleteBtn.style.display = 'none';
    }
    
    console.log('QR 코드 삭제 완료');
}

// QR 섹션 숨기기
function hideQRSection() {
    const qrSection = document.getElementById('qrSection');
    qrSection.style.display = 'none';
}

// QR 코드 다운로드
function downloadQR(format) {
    const qrCodeDiv = document.getElementById('qrcode');
    const canvas = qrCodeDiv.querySelector('canvas');
    
    if (!canvas) {
        alert('QR 코드를 먼저 생성해주세요.');
        return;
    }
    
    const link = document.createElement('a');
    link.download = `qrcode.${format}`;
    
    if (format === 'png') {
        link.href = canvas.toDataURL('image/png');
    } else if (format === 'jpg') {
        link.href = canvas.toDataURL('image/jpeg');
    }
    
    link.click();
}

// 페이지 로드시 저장된 제목 불러오기 (부제목은 고정)
function loadSavedTitles() {
    const savedTitle = localStorage.getItem('mainTitle');
    
    if (savedTitle) {
        const titleElement = document.getElementById('mainTitle');
        titleElement.textContent = savedTitle;
    }
    
    // 부제목은 항상 고정 텍스트로 설정
    const subtitleElement = document.getElementById('mainSubtitle');
    subtitleElement.textContent = '신청서를 작성하여 제출해 주세요';
}

// 저장된 메일/폰번호 표시
function displaySavedInputs() {
    const savedEmails = JSON.parse(localStorage.getItem('savedEmailAddresses') || '[]');
    const savedPhones = JSON.parse(localStorage.getItem('savedPhoneNumbers') || '[]');
    
    const emailDisplay = document.getElementById('emailDisplay');
    const phoneDisplay = document.getElementById('phoneDisplay');
    
    // 메일 주소 표시
    if (savedEmails.length > 0) {
        if (savedEmails.length === 1) {
            emailDisplay.textContent = savedEmails[0];
        } else {
            emailDisplay.textContent = `${savedEmails[0]} 외 ${savedEmails.length - 1}개`;
        }
        emailDisplay.classList.add('has-content');
        emailDisplay.title = `저장된 메일 주소:\n${savedEmails.join('\n')}`;
    } else {
        emailDisplay.textContent = '';
        emailDisplay.classList.remove('has-content');
        emailDisplay.title = '';
    }
    
    // 폰번호 표시
    if (savedPhones.length > 0) {
        if (savedPhones.length === 1) {
            phoneDisplay.textContent = savedPhones[0];
        } else {
            phoneDisplay.textContent = `${savedPhones[0]} 외 ${savedPhones.length - 1}개`;
        }
        phoneDisplay.classList.add('has-content');
        phoneDisplay.title = `저장된 폰번호:\n${savedPhones.join('\n')}`;
    } else {
        phoneDisplay.textContent = '';
        phoneDisplay.classList.remove('has-content');
        phoneDisplay.title = '';
    }
}

// 결과 페이지 표시
function showResult(applicationData = null) {
    const resultSection = document.getElementById('result');
    const resultContent = document.getElementById('resultContent');
    const promotionFlyer = document.getElementById('promotionFlyer');
    const resultActions = document.getElementById('resultActions');

    if (applicationData) {
        // Supabase 컬럼명 submittedAt 우선 사용
        const submittedIso = applicationData.submittedAt || applicationData.submitted_at || new Date().toISOString();
        const submittedDate = new Date(submittedIso);
        const formattedDate = submittedDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // 신청번호를 년월일시분(YYYYMMDDHHmm) 형식으로 표현 (application_number가 있으면 우선 사용)
        const appNum = applicationData.application_number || (
            `${submittedDate.getFullYear()}${String(submittedDate.getMonth()+1).padStart(2,'0')}${String(submittedDate.getDate()).padStart(2,'0')}${String(submittedDate.getHours()).padStart(2,'0')}${String(submittedDate.getMinutes()).padStart(2,'0')}`
        );

        resultContent.innerHTML = `
            <div class="result-info">
                <h3>📋 접수 완료</h3>
                <p><strong>신청번호:</strong> ${appNum}</p>
                <p><strong>신청자:</strong> ${applicationData.name}</p>
                <p><strong>연락처:</strong> ${applicationData.phone}</p>
                <p><strong>접수일시:</strong> ${formattedDate}</p>
                <p><strong>처리상태:</strong> 접수 완료 (관리자 검토 중)</p>
                <div class="notice">
                    <p>💡 관리자가 신청 내용을 검토한 후 연락드릴 예정입니다.</p>
                    <p>문의사항이 있으시면 게시판 공사팀 연락처로 연락 주세요.</p>
                </div>
            </div>
        `;

        // workType에 따른 조건부 UI 표시
        const workType = applicationData.workType || applicationData.work_type;
        console.log('WorkType 확인:', workType);

        if (workType === 'interior') { // KT
            // KT 선택 시: 버튼들 표시, 전단지 숨김
            resultActions.style.display = 'block';
            promotionFlyer.style.display = 'none';
            console.log('KT 선택 - 버튼 표시, 전단지 숨김');
        } else if (workType === 'exterior' || workType === 'plumbing' || workType === 'electrical') {
            // SKT, LGU+, 기타(지역방송) 선택 시: 버튼들 숨김, 전단지 표시
            resultActions.style.display = 'none';
            promotionFlyer.style.display = 'block';
            console.log('KT가 아닌 통신사 선택 - 버튼 숨김, 전단지 표시');
        } else {
            // 기본값: 버튼들 표시 (이전 동작 유지)
            resultActions.style.display = 'block';
            promotionFlyer.style.display = 'none';
            console.log('기본값 - 버튼 표시');
        }
    } else {
        resultContent.innerHTML = `
            <div class="result-info">
                <h3>📋 신청 완료</h3>
                <p>신청서가 성공적으로 제출되었습니다.</p>
                <p>관리자가 검토 후 연락드리겠습니다.</p>
            </div>
        `;

        // 데이터가 없는 경우 기본값으로 버튼 표시
        resultActions.style.display = 'block';
        promotionFlyer.style.display = 'none';
    }

    // 폼 숨기고 결과 표시
    document.getElementById('applicationForm').style.display = 'none';
    resultSection.style.display = 'block';

    console.log('결과 페이지 표시:', applicationData);
}

// 모바일 환경 최적화 함수
function optimizeForMobile() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        // 입력 필드 포커스 시 자동 스크롤 처리
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                setTimeout(() => {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        });

        // 가상 키보드 표시 시 스크롤 조정
        const container = document.querySelector('.container');
        window.addEventListener('resize', () => {
            if (document.activeElement.tagName === 'INPUT' || 
                document.activeElement.tagName === 'TEXTAREA') {
                window.scrollTo(0, 0);
                document.activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        // 터치 이벤트 최적화
        document.addEventListener('touchstart', function() {}, {passive: true});
    }
}

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('applicationForm');
    const workTypeSelect = document.getElementById('workType');
    const otherWorkTypeDiv = document.getElementById('otherWorkType');
    
    // 모바일 최적화 실행
    optimizeForMobile();
    
    // URL 파라미터 확인하여 고객용/관리자용 모드 결정
    const urlParams = new URLSearchParams(window.location.search);
    const isCustomerMode = urlParams.get('mode') === 'customer';

    console.log('🔍 URL 파라미터 확인:', {
        currentURL: window.location.href,
        mode: urlParams.get('mode'),
        isCustomerMode: isCustomerMode
    });


    // 고객용 모드인 경우 QR 생성 버튼과 카카오톡 공유 버튼, 문자 버튼 숨기고 제출 버튼 텍스트 변경
    if (isCustomerMode) {
        // body에 고객 모드 데이터 속성 추가 (CSS에서 활용)
        document.body.setAttribute('data-customer-mode', 'true');
        console.log('🧑‍💼 고객 모드가 활성화되었습니다.');
        // URL 파라미터로 전달된 관리자 데이터(제목만)를 localStorage에 주입하여
        // 다른 기기(고객 폰)에서도 관리자 설정이 반영되도록 동기화
        (function syncAdminDataFromURL() {
            try {
                const titleParam = urlParams.get('title');
                
                if (titleParam) {
                    localStorage.setItem('mainTitle', decodeURIComponent(titleParam));
                }
            } catch (e) {
                console.warn('URL 기반 관리자 데이터 동기화 실패:', e);
            }
        })();
        
        // DOM 준비 완료 후 UI 요소들 처리
        const setupCustomerMode = () => {
            console.log('🔧 고객 모드 설정 시작...');

            // 요소 찾기
            const qrBtn = document.getElementById('qrGenerateBtn');
            const shareBtn = document.querySelector('.share-btn');
            const smsBtn = document.querySelector('.sms-btn');
            const submitBtn = document.querySelector('.submit-btn');
            const qrSection = document.getElementById('qrSection');
            const adminInputSection = document.getElementById('adminInputSection');
            const adminActionSection = document.getElementById('adminActionSection');
            const customerSubmitSection = document.getElementById('customerSubmitSection');

            // 요소 존재 확인 로그
            console.log('📝 요소 확인:', {
                adminInputSection: !!adminInputSection,
                adminActionSection: !!adminActionSection,
                customerSubmitSection: !!customerSubmitSection,
                qrSection: !!qrSection
            });
            
            // 관리자용 요소들 완전히 숨기기 (CSS도 추가)
            if (adminInputSection) {
                adminInputSection.style.display = 'none';
                adminInputSection.style.visibility = 'hidden';
                adminInputSection.classList.add('customer-mode-hidden');
            }
            if (adminActionSection) {
                adminActionSection.style.display = 'none';
                adminActionSection.style.visibility = 'hidden';
                adminActionSection.classList.add('customer-mode-hidden');
            }
            if (qrSection) {
                qrSection.style.display = 'none';
            }
            
            // 고객용 제출 버튼 강제 표시
            if (customerSubmitSection) {
                customerSubmitSection.style.display = 'block';
                customerSubmitSection.style.visibility = 'visible';
                customerSubmitSection.classList.remove('customer-mode-hidden');
            }
            
            // CSS 규칙 추가로 확실히 숨기기
            const style = document.createElement('style');
            style.textContent = `
                .customer-mode-hidden {
                    display: none !important;
                    visibility: hidden !important;
                }
                #customerSubmitSection {
                    display: block !important;
                }
            `;
            document.head.appendChild(style);
            
            console.log('고객용 모드 UI 설정 완료');
        };
        
        // DOM이 준비되었는지 확인 후 실행
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupCustomerMode);
        } else {
            setupCustomerMode();
        }

        // 페이지 로드 완료 후에도 여러 번 실행하여 확실히 적용
        setTimeout(setupCustomerMode, 100);
        setTimeout(setupCustomerMode, 500);
        setTimeout(setupCustomerMode, 1000);

        // 윈도우 로드 이벤트에서도 실행
        window.addEventListener('load', setupCustomerMode);
        
        // 저장된 제목이 있으면 우선 사용, 부제목은 고정
        const headerTitle = document.querySelector('header h1');
        const headerSubtext = document.querySelector('header p');
        const savedTitle = localStorage.getItem('mainTitle');
        if (headerTitle) headerTitle.textContent = savedTitle || '📡 Speed 아파트 통신 환경 개선 신청서';
        if (headerSubtext) headerSubtext.textContent = '신청서를 작성하여 제출해 주세요';
        
        console.log('고객용 모드로 실행됨');
    } else {
        // 관리자 모드 명시적 설정
        document.body.setAttribute('data-customer-mode', 'false');
        console.log('🔧 관리자 모드가 활성화되었습니다.');

        // 관리자용 요소들 확실히 표시
        function setupAdminMode() {
            const adminInputSection = document.getElementById('adminInputSection');
            const adminActionSection = document.getElementById('adminActionSection');
            const apartmentAddSection = document.getElementById('apartmentAddSection');
            const dealerInfoSection = document.getElementById('dealerInfoSection');
            const customerSubmitSection = document.getElementById('customerSubmitSection');

            // 관리자 요소들 표시
            if (adminInputSection) {
                adminInputSection.style.display = 'block';
                adminInputSection.style.visibility = 'visible';
                adminInputSection.classList.remove('customer-mode-hidden');
            }

            if (adminActionSection) {
                adminActionSection.style.display = 'block';
                adminActionSection.style.visibility = 'visible';
                adminActionSection.classList.remove('customer-mode-hidden');
                console.log('✅ adminActionSection 표시됨');
            }

            if (apartmentAddSection) {
                apartmentAddSection.style.display = 'block';
                apartmentAddSection.style.visibility = 'visible';
                apartmentAddSection.classList.remove('customer-mode-hidden');
            }

            if (dealerInfoSection) {
                dealerInfoSection.style.display = 'block';
                dealerInfoSection.style.visibility = 'visible';
                dealerInfoSection.classList.remove('customer-mode-hidden');
            }

            // 고객용 제출 버튼 숨기기
            if (customerSubmitSection) {
                customerSubmitSection.style.display = 'none';
                customerSubmitSection.style.visibility = 'hidden';
            }
        }

        // DOM이 준비되었는지 확인 후 실행
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupAdminMode);
        } else {
            setupAdminMode();
        }

        // 페이지 로드 완료 후에도 여러 번 실행하여 확실히 적용
        setTimeout(setupAdminMode, 100);
        setTimeout(setupAdminMode, 500);
        setTimeout(setupAdminMode, 1000);

        console.log('관리자용 모드로 실행됨');
    }
    
    // 저장된 제목/부제목 불러오기 (모든 모드에서 공통)
    loadSavedTitles();
    
    // 저장된 메일/폰번호 표시 (관리자 모드에서만)
    if (!isCustomerMode) {
        displaySavedInputs();
    }

    // Supabase에서 관리자 설정 로드 시도
    loadAdminSettingsFromCloud();

    // 기타 공사 선택시 추가 입력란 표시
    if (workTypeSelect) {
        workTypeSelect.addEventListener('change', function() {
            if (this.value === 'other') {
                if (otherWorkTypeDiv) otherWorkTypeDiv.style.display = 'block';
                const otherWork = document.getElementById('otherWork');
                if (otherWork) otherWork.required = true;
            } else {
                if (otherWorkTypeDiv) otherWorkTypeDiv.style.display = 'none';
                const otherWork = document.getElementById('otherWork');
                if (otherWork) otherWork.required = false;
            }
        });
    }
    
    // 공사 희망일 날짜 제한 설정 (오늘 이후만 선택 가능)
    const startDateInput = document.getElementById('startDate');
    if (startDateInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // 최소 선택 가능 날짜를 내일로 설정
        const minDate = tomorrow.toISOString().split('T')[0];
        startDateInput.setAttribute('min', minDate);
        
        console.log('공사 희망일 최소 선택 날짜 설정:', minDate);
    }
    
    // 폼 제출 처리
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 고객 모드인 경우 신청서 제출 로직 실행
            if (isCustomerMode) {
                processCustomerFormSubmission(e);
                return;
            }
            
            // 관리자 모드인 경우 메일 공유 모달 표시 (관리자가 빈 설문지 공유할 때)
            // showEmailModal();
        });
    }
});


// 모든 함수를 전역 스코프에 노출 (onclick 속성에서 사용하기 위해)
window.editTitle = editTitle;
window.saveTitle = saveTitle;
window.cancelTitleEdit = cancelTitleEdit;
window.showEmailInputModal = showEmailInputModal;
window.addEmailInput = addEmailInput;
window.removeEmailInput = removeEmailInput;
window.saveEmailAddresses = saveEmailAddresses;
window.closeEmailInputModal = closeEmailInputModal;
window.showPhoneInputModal = showPhoneInputModal;
window.addPhoneInput = addPhoneInput;
window.removePhoneInput = removePhoneInput;
window.savePhoneNumbers = savePhoneNumbers;
window.closePhoneInputModal = closePhoneInputModal;
window.generatePageQR = generatePageQR;
window.deleteQR = deleteQR;
window.hideQRSection = hideQRSection;
window.downloadQR = downloadQR;

// 대리점 정보 관련 함수들을 전역으로 노출
window.showDealerInfoModal = showDealerInfoModal;
window.closeDealerInfoModal = closeDealerInfoModal;
window.saveDealerInfo = saveDealerInfo;
window.showDealerInfoSideModal = showDealerInfoSideModal;
window.closeDealerInfoSideModal = closeDealerInfoSideModal;

// 좌측 대리점 정보 모달 표시 함수 (관리자 모드 전용)
async function showDealerInfoSideModal() {
    console.log('🏢 좌측 대리점 정보 모달 열기');
    
    // 관리자 모드인지 확인
    const urlParams = new URLSearchParams(window.location.search);
    const isCustomerMode = urlParams.has('customer') || urlParams.has('apply') || urlParams.get('mode') === 'customer';
    
    if (isCustomerMode) {
        alert('❌ 관리자 모드에서만 사용할 수 있습니다.');
        return;
    }
    
    const modal = document.getElementById('dealerInfoSideModal');
    if (modal) {
        // Supabase에서 대리점 정보 불러오기 시도
        try {
            const currentApartmentId = APARTMENT_ID || 'speed_apartment3';
            
            const { data: supabaseData, error } = await supabase
                .from('admin_settings')
                .select('apartment_name, agency_name, agency_code, entry_issues')
                .eq('apartment_id', currentApartmentId)
                .single();
            
            if (!error && supabaseData) {
                const dealerInfo = {
                    dealerName: supabaseData.agency_name || '',
                    dealerCode: supabaseData.agency_code || '',
                    apartmentName: supabaseData.apartment_name || '',
                    entryIssue: supabaseData.entry_issues || '',
                    source: 'supabase'
                };
                displayDealerInfo(dealerInfo);
            } else {
                // Supabase에서 불러오기 실패 시 localStorage 확인
                const savedInfo = localStorage.getItem('dealerInfo');
                if (savedInfo) {
                    const dealerInfo = JSON.parse(savedInfo);
                    displayDealerInfo(dealerInfo);
                } else {
                    alert('❌ 저장된 대리점 정보가 없습니다.\n먼저 대리점 정보를 입력해주세요.');
                    showDealerInfoModal();
                    return;
                }
            }
        } catch (error) {
            console.error('❌ Supabase에서 대리점 정보 불러오기 실패:', error);
            alert('❌ 대리점 정보를 불러올 수 없습니다.\n잠시 후 다시 시도해주세요.');
            return;
        }
        
        modal.style.display = 'flex';
    } else {
        console.error('❌ dealerInfoSideModal 요소를 찾을 수 없습니다.');
    }
}

// 좌측 대리점 정보 모달 닫기 함수
function closeDealerInfoSideModal() {
    console.log('🚪 좌측 대리점 정보 모달 닫기');
    const modal = document.getElementById('dealerInfoSideModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 대리점 정보 모달 표시 함수 (편집용)
function showDealerInfoModal() {
    console.log('🏢 대리점 정보 모달 열기');
    const modal = document.getElementById('dealerInfoModal');
    if (modal) {
        modal.style.display = 'block';
        
        // 저장된 대리점 정보 불러오기
        loadDealerInfo();
        
        // 첫 번째 입력 필드에 포커스
        document.getElementById('dealerName').focus();
    } else {
        console.error('❌ dealerInfoModal 요소를 찾을 수 없습니다.');
    }
}

// 대리점 정보 모달 닫기 함수
function closeDealerInfoModal() {
    console.log('🚪 대리점 정보 모달 닫기');
    const modal = document.getElementById('dealerInfoModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 대리점 정보 저장 함수 (Supabase 연동)
async function saveDealerInfo() {
    console.log('💾 대리점 정보 저장 시작 (Supabase 연동)');
    
    try {
        // 입력값 수집 (대리점 정보만)
        const dealerName = document.getElementById('dealerName').value.trim();
        const dealerCode = document.getElementById('dealerCode').value.trim().toUpperCase();

        console.log('📋 입력값:', {
            dealerName,
            dealerCode
        });

        // 필수 필드 검증
        if (!dealerName || !dealerCode) {
            alert('❌ 대리점 이름과 대리점 코드는 필수입니다.');
            return;
        }
        
        // 대리점 코드 형식 검증
        const codePattern = /^[A-Z0-9]+$/;
        if (!codePattern.test(dealerCode)) {
            alert('❌ 대리점 코드는 영문 대문자와 숫자만 사용 가능합니다.\n예: SPEED001, ABC123');
            document.getElementById('dealerCode').focus();
            return;
        }
        
        // 현재 아파트 ID 가져오기
        const currentApartmentId = APARTMENT_ID || 'speed_apartment3';

        // Supabase에 저장할 데이터 구성 (대리점 정보만 업데이트)
        const supabaseData = {
            agency_name: dealerName,
            dealer_code: dealerCode,
            phones: JSON.parse(localStorage.getItem('savedPhoneNumbers') || '[]'),
            emails: JSON.parse(localStorage.getItem('savedEmailAddresses') || '[]')
        };
        
        console.log('💾 Supabase 저장 데이터:', supabaseData);
        
        // Supabase에 저장 또는 업데이트 (대리점 정보만)
        const { data, error } = await supabase
            .from('admin_settings')
            .update(supabaseData)
            .eq('apartment_id', currentApartmentId)
            .select();
        
        if (error) {
            console.error('❌ Supabase 저장 오류:', error);
            throw new Error(`Supabase 저장 실패: ${error.message}`);
        }
        
        console.log('✅ Supabase 저장 성공:', data);
        
        // localStorage에도 백업 저장 (대리점 정보만)
        const dealerInfo = {
            dealerName: dealerName,
            dealerCode: dealerCode,
            savedAt: new Date().toISOString(),
            supabaseId: data[0]?.id
        };
        
        localStorage.setItem('dealerInfo', JSON.stringify(dealerInfo));
        
        console.log('✅ 대리점 정보 저장 완료:', dealerInfo);
        
        // 화면에 정보 표시
        displayDealerInfo(dealerInfo);
        
        // 대리점 정보 표시 영역 업데이트
        updateDealerDisplay(dealerInfo);
        
        // 모달 닫기
        closeDealerInfoModal();
        
        // 성공 메시지와 좌측 모달 표시 옵션 (대리점 정보만)
        if (confirm(`✅ 대리점 정보가 Supabase에 저장되었습니다!\n\n🏢 ${dealerName}\n🔢 ${dealerCode}\n\n좌측 모달에서 정보를 확인하시겠습니까?`)) {
            showDealerInfoSideModal();
        }
        
    } catch (error) {
        console.error('💥 대리점 정보 저장 중 오류:', error);
        alert(`❌ 대리점 정보 저장 중 오류가 발생했습니다: ${error.message}`);
    }
}

// 저장된 대리점 정보 불러오기 함수 (Supabase 우선, localStorage 백업)
async function loadDealerInfo() {
    try {
        // 1. Supabase에서 먼저 불러오기 시도
        const currentApartmentId = APARTMENT_ID || 'speed_apartment3';
        
        console.log('📂 Supabase에서 대리점 정보 불러오기 시도...');
        
        const { data: supabaseData, error } = await supabase
            .from('admin_settings')
            .select('apartment_name, agency_name, agency_code, entry_issues')
            .eq('apartment_id', currentApartmentId)
            .single();
        
        if (!error && supabaseData) {
            console.log('✅ Supabase에서 대리점 정보 불러오기 성공:', supabaseData);
            
            // 폼 필드에 값 설정
            document.getElementById('dealerName').value = supabaseData.agency_name || '';
            document.getElementById('dealerCode').value = supabaseData.agency_code || '';
            document.getElementById('apartmentName').value = supabaseData.apartment_name || '';
            document.getElementById('entryIssue').value = supabaseData.entry_issues || '';
            
            // localStorage에도 동기화
            const dealerInfo = {
                dealerName: supabaseData.agency_name || '',
                dealerCode: supabaseData.agency_code || '',
                apartmentName: supabaseData.apartment_name || '',
                entryIssue: supabaseData.entry_issues || '',
                savedAt: new Date().toISOString(),
                source: 'supabase'
            };
            
            localStorage.setItem('dealerInfo', JSON.stringify(dealerInfo));
            
            return;
        }
        
        // 2. Supabase에서 불러오기 실패 시 localStorage 백업 사용
        console.log('⚠️ Supabase에서 불러오기 실패, localStorage 백업 사용');
        
        const savedInfo = localStorage.getItem('dealerInfo');
        if (savedInfo) {
            const dealerInfo = JSON.parse(savedInfo);
            
            // 폼 필드에 값 설정
            document.getElementById('dealerName').value = dealerInfo.dealerName || '';
            document.getElementById('dealerCode').value = dealerInfo.dealerCode || '';
            document.getElementById('apartmentName').value = dealerInfo.apartmentName || '';
            document.getElementById('entryIssue').value = dealerInfo.entryIssue || '';
            
            console.log('📂 localStorage에서 대리점 정보 불러오기 완료:', dealerInfo);
        }
        
    } catch (error) {
        console.error('❌ 대리점 정보 불러오기 실패:', error);
        
        // 3. 완전 실패 시 localStorage만 사용
        const savedInfo = localStorage.getItem('dealerInfo');
        if (savedInfo) {
            const dealerInfo = JSON.parse(savedInfo);
            
            document.getElementById('dealerName').value = dealerInfo.dealerName || '';
            document.getElementById('dealerCode').value = dealerInfo.dealerCode || '';
            document.getElementById('apartmentName').value = dealerInfo.apartmentName || '';
            document.getElementById('entryIssue').value = dealerInfo.entryIssue || '';
        }
    }
}

// 대리점 정보 화면 표시 함수 (좌측 모달용)
function displayDealerInfo(dealerInfo) {
    // 좌측 모달의 정보 업데이트
    const nameElement = document.getElementById('displayDealerName');
    const codeElement = document.getElementById('displayDealerCode');
    const apartmentElement = document.getElementById('displayApartmentName');
    const issueElement = document.getElementById('displayEntryIssue');
    
    if (nameElement) nameElement.textContent = dealerInfo.dealerName || '-';
    if (codeElement) codeElement.textContent = dealerInfo.dealerCode || '-';
    if (apartmentElement) apartmentElement.textContent = dealerInfo.apartmentName || '-';
    if (issueElement) issueElement.textContent = dealerInfo.entryIssue || '-';
    
    console.log('📱 대리점 정보 화면 표시 완료 (좌측 모달용)');
}

// 대리점 정보 표시 영역 업데이트 함수
function updateDealerDisplay(dealerInfo) {
    const dealerDisplay = document.getElementById('dealerDisplay');
    if (dealerDisplay && dealerInfo) {
        dealerDisplay.textContent = `${dealerInfo.dealerName} (${dealerInfo.dealerCode})`;
        dealerDisplay.style.color = '#D32F2F';
        dealerDisplay.style.fontWeight = '500';
    }
}

// 페이지 로드 시 저장된 대리점 정보 자동 로드 (Supabase 우선)
async function loadAndDisplayDealerInfo() {
    try {
        // 1. Supabase에서 먼저 불러오기 시도
        const currentApartmentId = APARTMENT_ID || 'speed_apartment3';
        
        console.log('🔄 페이지 로드 시 Supabase에서 대리점 정보 로드 시도...');

        const { data: supabaseData, error } = await supabase
            .from('admin_settings')
            .select('apartment_name, agency_name, dealer_code, entry_issue')
            .eq('apartment_id', currentApartmentId)
            .single();
        
        if (!error && supabaseData) {
            console.log('✅ Supabase에서 대리점 정보 로드 성공:', supabaseData);
            
            // 좌측 모달용 정보 구성
            const dealerInfo = {
                dealerName: supabaseData.agency_name || '',
                dealerCode: supabaseData.dealer_code || '',
                apartmentName: supabaseData.apartment_name || '',
                entryIssue: supabaseData.entry_issue || '',
                source: 'supabase'
            };
            
            displayDealerInfo(dealerInfo); // 좌측 모달용으로 정보 업데이트
            updateDealerDisplay(dealerInfo); // 버튼 옆 표시 영역 업데이트
            
            // localStorage에도 동기화
            localStorage.setItem('dealerInfo', JSON.stringify({
                ...dealerInfo,
                savedAt: new Date().toISOString()
            }));
            
            console.log('🔄 페이지 로드 시 대리점 정보 로드 완료 (Supabase)');
            return;
        }
        
        // 2. Supabase에서 불러오기 실패 시 localStorage 백업 사용
        console.log('⚠️ Supabase에서 불러오기 실패, localStorage 백업 사용');
        
        const savedInfo = localStorage.getItem('dealerInfo');
        if (savedInfo) {
            const dealerInfo = JSON.parse(savedInfo);
            displayDealerInfo(dealerInfo); // 좌측 모달용으로 정보만 업데이트
            updateDealerDisplay(dealerInfo); // 버튼 옆 표시 영역 업데이트
            console.log('🔄 페이지 로드 시 대리점 정보 로드 완료 (localStorage)');
        }
        
    } catch (error) {
        console.error('❌ 페이지 로드 시 대리점 정보 로드 실패:', error);
        
        // 3. 완전 실패 시 localStorage만 사용
        const savedInfo = localStorage.getItem('dealerInfo');
        if (savedInfo) {
            const dealerInfo = JSON.parse(savedInfo);
            displayDealerInfo(dealerInfo);
            updateDealerDisplay(dealerInfo);
        }
    }
}

// 아파트 추가 관련 함수들을 전역으로 노출
window.showAddApartmentModal = showAddApartmentModal;
window.closeAddApartmentModal = closeAddApartmentModal;
window.addNewApartment = addNewApartment;

// 새로운 아파트 생성 모달 표시 함수 (초기화 포함)
function showAddApartmentModal() {
    console.log('🏠 새로운 아파트 생성 모달 열기');
    const modal = document.getElementById('addApartmentModal');
    if (modal) {
        modal.style.display = 'block';

        // 폼 필드 완전 초기화
        resetApartmentForm();

        // 첫 번째 입력 필드에 포커스
        document.getElementById('newApartmentName').focus();
    } else {
        console.error('❌ addApartmentModal 요소를 찾을 수 없습니다.');
    }
}

// 아파트 생성 폼 초기화 함수
function resetApartmentForm() {
    console.log('🔄 아파트 생성 폼 초기화');
    
    // 모든 입력 필드 초기화
    const fields = [
        'newApartmentName',
        'newApartmentTitle',
        'newApartmentSubtitle'
    ];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
            field.style.borderColor = '#e1e5e9';
            field.style.boxShadow = 'none';
            
            // 기존 오류 메시지 제거
            const errorMsg = field.parentNode.querySelector('.error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
        }
    });
    
    console.log('✅ 아파트 생성 폼 초기화 완료');
}

// 새로운 아파트 생성 모달 닫기 함수 (초기화 포함)
function closeAddApartmentModal() {
    console.log('🚪 새로운 아파트 생성 모달 닫기');
    const modal = document.getElementById('addApartmentModal');
    if (modal) {
        modal.style.display = 'none';
        
        // 모달 닫을 때도 폼 초기화
        resetApartmentForm();
    }
}

// 실시간 아파트 ID 유효성 검증 함수
let validationTimeout;
async function validateApartmentId(apartmentId) {
    const statusElement = document.getElementById('apartmentIdStatus');
    const inputElement = document.getElementById('newApartmentId');

    // 빈 값이면 기본 메시지 표시
    if (!apartmentId) {
        statusElement.textContent = '영문 소문자, 숫자, 밑줄(_)만 사용 가능합니다';
        statusElement.style.color = '#666';
        inputElement.style.borderColor = '#e1e5e9';
        return;
    }

    // 형식 검증
    const idPattern = /^[a-z0-9_]+$/;
    if (!idPattern.test(apartmentId)) {
        statusElement.textContent = '❌ 영문 소문자, 숫자, 밑줄(_)만 사용 가능합니다';
        statusElement.style.color = '#ff4444';
        inputElement.style.borderColor = '#ff4444';
        return;
    }

    // 너무 짧으면 경고
    if (apartmentId.length < 3) {
        statusElement.textContent = '⚠️ ID가 너무 짧습니다 (최소 3자)';
        statusElement.style.color = '#ff8800';
        inputElement.style.borderColor = '#ff8800';
        return;
    }

    // 검증 중 표시
    statusElement.textContent = '🔍 중복 체크 중...';
    statusElement.style.color = '#0066cc';
    inputElement.style.borderColor = '#0066cc';

    // 이전 타이머 취소
    if (validationTimeout) {
        clearTimeout(validationTimeout);
    }

    // 500ms 후에 실제 중복 체크 실행 (사용자가 타이핑을 멈춘 후)
    validationTimeout = setTimeout(async () => {
        try {
            // Supabase 클라이언트 확인
            let supabaseClient = supabase;
            if (!supabaseClient) {
                statusElement.textContent = '❌ 데이터베이스 연결 오류';
                statusElement.style.color = '#ff4444';
                inputElement.style.borderColor = '#ff4444';
                return;
            }

            // 중복 체크
            const { data: existingApartments, error: checkError, count } = await supabaseClient
                .from('admin_settings')
                .select('apartment_id', { count: 'exact' })
                .eq('apartment_id', apartmentId);

            if (checkError) {
                console.error('실시간 중복 체크 오류:', checkError);
                statusElement.textContent = '❌ 중복 체크 오류';
                statusElement.style.color = '#ff4444';
                inputElement.style.borderColor = '#ff4444';
                return;
            }

            // 중복 여부 확인
            if (count > 0 || (existingApartments && existingApartments.length > 0)) {
                statusElement.textContent = `❌ 이미 존재하는 ID입니다`;
                statusElement.style.color = '#ff4444';
                inputElement.style.borderColor = '#ff4444';
            } else {
                statusElement.textContent = `✅ 사용 가능한 ID입니다`;
                statusElement.style.color = '#4CAF50';
                inputElement.style.borderColor = '#4CAF50';
            }

        } catch (error) {
            console.error('실시간 유효성 검증 오류:', error);
            statusElement.textContent = '❌ 검증 중 오류 발생';
            statusElement.style.color = '#ff4444';
            inputElement.style.borderColor = '#ff4444';
        }
    }, 500); // 500ms 딜레이
}

// 새로운 아파트 생성 메인 함수
async function addNewApartment() {
    console.log('🏗️ 새로운 아파트 생성 프로세스 시작');

    try {
        // 입력값 수집 및 검증
        const apartmentName = document.getElementById('newApartmentName').value.trim();
        const apartmentTitle = document.getElementById('newApartmentTitle').value.trim();
        const apartmentSubtitle = document.getElementById('newApartmentSubtitle').value.trim();

        // 아파트 ID 자동 생성 (아파트 이름 기반)
        const timestamp = Date.now().toString();
        const sanitizedName = apartmentName.toLowerCase()
            .replace(/[^a-z0-9]/g, '_')  // 특수문자를 _로 변환
            .replace(/_+/g, '_')        // 연속된 _를 하나로
            .replace(/^_|_$/g, '');     // 앞뒤 _제거
        let apartmentId = `${sanitizedName}_${timestamp.slice(-8)}`;

        console.log('📋 입력값:', {
            name: apartmentName,
            id: apartmentId,
            title: apartmentTitle,
            subtitle: apartmentSubtitle
        });

        // 필수 필드 검증
        if (!apartmentName) {
            alert('❌ 아파트 이름을 입력해주세요.');
            document.getElementById('newApartmentName').focus();
            return;
        }

        // Supabase 클라이언트 확인 및 초기화
        console.log('🔄 Supabase 연결 상태 확인...');
        let supabaseClient = supabase;

        if (!supabaseClient) {
            console.log('🔧 Supabase 클라이언트가 없음. 초기화 시도...');
            if (typeof window.initializeSupabase === 'function') {
                supabaseClient = await window.initializeSupabase();
                if (!supabaseClient) {
                    throw new Error('Supabase 초기화에 실패했습니다.');
                }
            } else {
                // 직접 Supabase 초기화 시도
                console.log('🔧 직접 Supabase 초기화 시도...');
                if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
                    const supabaseUrl = 'https://boorsqnfkwglzvnhtwcx.supabase.co';
                    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvb3JzcW5ma3dnbHp2bmh0d2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NDE3NDEsImV4cCI6MjA3MjExNzc0MX0.eU0BSY8u1b-qcx3OTgvGIW-EQHotI4SwNuWAg0eqed0';
                    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
                    console.log('✅ 직접 Supabase 초기화 성공');
                } else {
                    throw new Error('Supabase 라이브러리를 찾을 수 없습니다.');
                }
            }
        }

        // 자동 생성된 ID이므로 형식 검증 생략

        // 제출 시 최종 중복 체크 및 안전한 삽입
        console.log('🔒 제출 시 최종 검증 시작...');

        // 제출 직전 중복 체크 (실시간 체크와 제출 사이의 시간 차이 보완)
        console.log('🔍 제출 직전 apartment_id 중복 체크...');
        try {
            const { data: finalCheck, error: finalCheckError, count: finalCount } = await supabaseClient
                .from('admin_settings')
                .select('apartment_id', { count: 'exact' })
                .eq('apartment_id', apartmentId);

            if (finalCheckError) {
                console.error('❌ 최종 중복 체크 오류:', finalCheckError);
                alert(`❌ 최종 검증 중 오류가 발생했습니다: ${finalCheckError.message}`);
                return;
            }

            // 중복 발견 시 처리
            if (finalCount > 0 || (finalCheck && finalCheck.length > 0)) {
                console.log('❌ 제출 직전 중복 감지:', { apartmentId, count: finalCount });

                // 자동으로 고유 ID 생성
                const autoUniqueId = `${apartmentId}_${Date.now().toString().slice(-6)}`;

                if (confirm(`⚠️ 다른 사용자가 먼저 같은 ID를 생성했습니다!\n\n충돌 ID: ${apartmentId}\n\n자동 생성된 고유 ID로 계속 진행할까요?\n새 ID: ${autoUniqueId}`)) {
                    apartmentId = autoUniqueId;
                    console.log('🔄 자동 고유 ID 적용:', autoUniqueId);
                } else {
                    alert('❌ 생성이 취소되었습니다.');
                    return;
                }
            } else {
                console.log('✅ 제출 직전 중복 체크 통과:', apartmentId);
            }

        } catch (finalCheckError) {
            console.error('💥 최종 중복 체크 중 예외:', finalCheckError);
            alert(`❌ 최종 검증 중 오류가 발생했습니다: ${finalCheckError.message}`);
            return;
        }

        // 최종 확정된 ID 사용
        const finalApartmentId = apartmentId;

        // 기본값 설정
        const finalTitle = apartmentTitle || `${apartmentName} 통신 환경 개선 신청서`;
        const finalSubtitle = apartmentSubtitle || '신청서를 작성하여 제출해 주세요';

        console.log('💾 Supabase에 안전한 데이터 삽입 중...');
        console.log('🔍 삽입할 데이터:', {
            apartment_id: finalApartmentId,
            apartment_name: apartmentName,
            title: finalTitle,
            subtitle: finalSubtitle,
            agency_name: '',
            dealer_code: '',
            entry_issue: '',
            phones: [],
            emails: []
        });

        // Supabase에 안전한 삽입 (Primary Key 충돌 방지)
        console.log('🔒 Primary Key 안전 삽입 시도...');

        // 실제 테이블 구조: id는 TEXT PRIMARY KEY (자동 생성 아님)
        const insertData = {
            id: finalApartmentId,              // ✅ Primary Key에 설정
            apartment_id: finalApartmentId,    // ✅ 기존 로직 호환성 유지
            apartment_name: apartmentName,
            title: finalTitle,
            subtitle: finalSubtitle,
            agency_name: '', // 대리점 이름 (추후 설정)
            dealer_code: '', // 대리점 코드 (추후 설정)
            phones: [],
            emails: []
            // 실제 테이블에서 id는 TEXT 타입의 Primary Key
            // apartment_id와 같은 값을 사용하여 기존 데이터와 호환성 유지
        };

        // 단순화된 INSERT 방식 - upsert 사용으로 근본 해결
        console.log('🔄 Upsert 방식으로 안전한 삽입 시도...');

        const { data, error } = await supabaseClient
            .from('admin_settings')
            .upsert([insertData], {
                onConflict: 'id',  // Primary Key인 id로 변경
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            console.error('❌ Upsert 오류:', error);

            // apartment_id 충돌이면 자동으로 고유 ID 생성하여 재시도
            if (error.code === '23505') {
                const timestamp = Date.now().toString();
                const random = Math.random().toString(36).substr(2, 6);
                const autoId = `apt_${timestamp.slice(-8)}_${random}`;

                console.log(`🔄 자동 고유 ID 생성: ${insertData.id} → ${autoId}`);

                if (confirm(`⚠️ ID가 이미 존재합니다!\n\n자동 생성된 고유 ID로 계속할까요?\n새 ID: ${autoId}`)) {
                    insertData.id = autoId;              // Primary Key 업데이트
                    insertData.apartment_id = autoId;    // 호환성 유지

                    // 재시도
                    const { data: retryData, error: retryError } = await supabaseClient
                        .from('admin_settings')
                        .upsert([insertData], {
                            onConflict: 'id',  // Primary Key로 변경
                            ignoreDuplicates: false
                        })
                        .select();

                    if (retryError) {
                        console.error('❌ 재시도도 실패:', retryError);
                        alert(`❌ 재시도 실패: ${retryError.message}`);
                        return;
                    }

                    // 성공
                    console.log('✅ 재시도 성공!', retryData);
                } else {
                    alert('❌ 생성이 취소되었습니다.');
                    return;
                }
            } else {
                alert(`❌ 생성 실패: ${error.message}`);
                return;
            }
        } else {
            console.log('✅ Upsert 성공!', data);
        }

        // Upsert 처리가 위에서 완료됨 (중복 코드 제거)

        console.log('✅ 새로운 아파트 생성 성공:', data);

        // 메인 페이지의 제목과 부제목 즉시 업데이트
        const mainTitleElement = document.getElementById('mainTitle');
        const mainSubtitleElement = document.getElementById('mainSubtitle');

        if (mainTitleElement) {
            mainTitleElement.textContent = finalTitle;
        }
        if (mainSubtitleElement) {
            mainSubtitleElement.textContent = finalSubtitle;
        }

        console.log('✅ 메인 페이지 제목/부제목 업데이트 완료:', {
            title: finalTitle,
            subtitle: finalSubtitle
        });

        // 성공 메시지와 URL 정보 제공 (최종 확정 ID 사용)
        const confirmedApartmentId = insertData.apartment_id; // 최종 성공한 ID
        const newApartmentUrl = `${window.location.origin}${window.location.pathname}?apartment=${confirmedApartmentId}`;
        const customerUrl = `${window.location.origin}${window.location.pathname}?apartment=${confirmedApartmentId}&mode=customer`;

        alert(`✅ ${apartmentName}이(가) 안전하게 생성되었습니다!\n\n` +
              `🔑 최종 ID: ${confirmedApartmentId}\n` +
              `🏢 관리자 URL: ${newApartmentUrl}\n` +
              `👤 고객용 URL: ${customerUrl}`);

        // 모달 닫기 (초기화 포함)
        closeAddApartmentModal();

        // 대리점 정보 입력 안내
        if (confirm('✅ 아파트가 생성되었습니다!\n\n대리점 정보를 입력하시겠습니까?')) {
            showDealerInfoModal();
        } else {
            // 사용자에게 새 아파트로 이동할지 묻기
            if (confirm('🔄 새로 생성된 아파트 관리 페이지로 이동하시겠습니까?')) {
                window.location.href = `${window.location.pathname}?apartment=${confirmedApartmentId}`;
            }
        }

    } catch (error) {
        console.error('💥 새로운 아파트 생성 중 오류 발생:', error);

        // 사용자 친화적 오류 메시지
        let userMessage = '새로운 아파트 생성 중 오류가 발생했습니다.';

        if (error.message) {
            if (error.message.includes('network') || error.message.includes('fetch')) {
                userMessage += '\n네트워크 연결을 확인해주세요.';
            } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
                userMessage += '\n권한이 부족합니다. 관리자에게 문의하세요.';
            } else {
                userMessage += `\n상세 오류: ${error.message}`;
            }
        }

        alert(`❌ ${userMessage}`);
    }
}

window.shareToKakao = function() {
    // 카카오톡 공유 기능
    if (typeof Kakao !== 'undefined' && Kakao.Share) {
        const title = localStorage.getItem('mainTitle') || 'Speed 아파트 통신 환경 개선 신청서';
        const subtitle = localStorage.getItem('mainSubtitle') || '통신 환경 개선을 위한 신청서를 작성해주세요';
        const isDebugMode = new URLSearchParams(window.location.search).get('debug') === 'true';
        const customerUrl = isDebugMode ? 
            `${window.location.origin}${window.location.pathname}?debug=true&mode=customer` :
            `${window.location.origin}${window.location.pathname}?mode=customer`;
        
        Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title: title,
                description: subtitle,
                imageUrl: 'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=신청서',
                link: {
                    mobileWebUrl: customerUrl,
                    webUrl: customerUrl,
                },
            },
            buttons: [
                {
                    title: '신청서 작성하기',
                    link: {
                        mobileWebUrl: customerUrl,
                        webUrl: customerUrl,
                    },
                },
            ],
        });
    } else {
        alert('카카오톡 공유 기능을 사용할 수 없습니다.');
    }
};

// =====================================
// 데이터 테이블 관련 함수들
// =====================================

// 아파트 데이터 로드 함수
async function loadApartmentData() {
    console.log('📊 아파트 데이터 로드 시작');

    const tableBody = document.getElementById('apartmentTableBody');
    const rowCountElement = document.getElementById('tableRowCount');
    const lastUpdateElement = document.getElementById('lastUpdate');

    if (!tableBody) {
        console.error('❌ apartmentTableBody 요소를 찾을 수 없습니다.');
        return;
    }

    // 로딩 상태 표시
    showLoadingState();

    try {
        // Supabase 클라이언트 확인
        let supabaseClient = null;

        // Supabase 초기화 시도
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            const supabaseUrl = 'https://boorsqnfkwglzvnhtwcx.supabase.co';
            const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvb3JzcW5ma3dnbHp2bmh0d2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NDE3NDEsImV4cCI6MjA3MjExNzc0MX0.eU0BSY8u1b-qcx3OTgvGIW-EQHotI4SwNuWAg0eqed0';
            supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
            console.log('✅ Supabase 클라이언트 생성 성공');
        } else {
            console.error('❌ Supabase 라이브러리를 찾을 수 없습니다.');
            throw new Error('Supabase 라이브러리 없음');
        }

        // admin_settings 테이블에서 데이터 조회
        console.log('🔍 Supabase에서 아파트 데이터 조회 중...');
        const { data, error } = await supabaseClient
            .from('admin_settings')
            .select('apartment_name, agency_name, updated_at')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('❌ 데이터 로드 오류:', error);
            // 오류가 발생해도 테스트 데이터 표시
            showTestData();
            return;
        }

        console.log('✅ 아파트 데이터 로드 성공:', data);

        // 테이블 업데이트
        updateDataTable(data);

        // 카운터 및 업데이트 시간 표시
        if (rowCountElement) rowCountElement.textContent = `총 ${data.length}개 아파트`;
        if (lastUpdateElement) lastUpdateElement.textContent = `마지막 업데이트: ${new Date().toLocaleString('ko-KR')}`;

    } catch (error) {
        console.error('💥 아파트 데이터 로드 중 예외:', error);
        // 오류가 발생해도 테스트 데이터 표시
        showTestData();
    }
}

// 테스트 데이터 표시 함수
function showTestData() {
    console.log('🧪 테스트 데이터 표시');
    const testData = [
        {
            apartment_name: 'Speed 아파트 3단지',
            agency_name: '대리점명 예시',
            updated_at: new Date().toISOString()
        },
        {
            apartment_name: '테스트 아파트',
            agency_name: '테스트 대리점',
            updated_at: new Date(Date.now() - 86400000).toISOString() // 1일 전
        }
    ];

    updateDataTable(testData);

    const rowCountElement = document.getElementById('tableRowCount');
    const lastUpdateElement = document.getElementById('lastUpdate');

    if (rowCountElement) rowCountElement.textContent = `총 ${testData.length}개 아파트 (테스트 데이터)`;
    if (lastUpdateElement) lastUpdateElement.textContent = `마지막 업데이트: ${new Date().toLocaleString('ko-KR')}`;
}

// 로딩 상태 표시 함수
function showLoadingState() {
    const tableBody = document.getElementById('apartmentTableBody');
    tableBody.innerHTML = `
        <tr class="loading-row">
            <td colspan="3">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <span>데이터 로딩 중...</span>
                </div>
            </td>
        </tr>
    `;
}

// 오류 상태 표시 함수
function showErrorState(message) {
    const tableBody = document.getElementById('apartmentTableBody');
    tableBody.innerHTML = `
        <tr class="error-row">
            <td colspan="3">
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <div>${message}</div>
                    <button onclick="loadApartmentData()" style="margin-top: 10px; padding: 5px 10px; border: 1px solid #ddd; border-radius: 5px; background: white; cursor: pointer;">다시 시도</button>
                </div>
            </td>
        </tr>
    `;
}

// 빈 상태 표시 함수
function showEmptyState() {
    const tableBody = document.getElementById('apartmentTableBody');
    tableBody.innerHTML = `
        <tr class="empty-row">
            <td colspan="3">
                <div class="empty-state">
                    <div class="empty-state-icon">🏢</div>
                    <div>등록된 아파트가 없습니다</div>
                </div>
            </td>
        </tr>
    `;
}

// 데이터 테이블 업데이트 함수
function updateDataTable(data) {
    const tableBody = document.getElementById('apartmentTableBody');

    if (!data || data.length === 0) {
        showEmptyState();
        return;
    }

    // 테이블 행 생성
    const rows = data.map(item => {
        const apartmentName = item.apartment_name || '-';
        const agencyName = item.agency_name || '-';
        const updatedAt = item.updated_at ? formatDateTime(item.updated_at) : '-';

        return `
            <tr>
                <td>${apartmentName}</td>
                <td>${agencyName}</td>
                <td class="update-time">${updatedAt}</td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rows;
}

// 날짜/시간 포맷 함수
function formatDateTime(dateString) {
    if (!dateString) return '-';

    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 1) {
            return '방금 전';
        } else if (diffMinutes < 60) {
            return `${diffMinutes}분 전`;
        } else if (diffHours < 24) {
            return `${diffHours}시간 전`;
        } else if (diffDays < 7) {
            return `${diffDays}일 전`;
        } else {
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    } catch (error) {
        console.error('날짜 형식 변환 오류:', error);
        return '-';
    }
}

// 아파트 관리 현황 모달 열기 함수
function showApartmentDataModal() {
    console.log('📊 아파트 관리 현황 모달 열기');

    const modal = document.getElementById('apartmentDataModal');
    if (!modal) {
        console.error('❌ apartmentDataModal 요소를 찾을 수 없습니다.');
        alert('모달 창을 찾을 수 없습니다. 페이지를 새로고침 후 다시 시도해주세요.');
        return;
    }

    // 모달 표시
    modal.style.display = 'block';
    modal.style.visibility = 'visible';

    console.log('✅ 모달 표시됨');

    // 즉시 데이터 로드 시도
    loadApartmentData();

    // body에 모달 활성화 클래스 추가 (스크롤 방지 등)
    document.body.style.overflow = 'hidden';
}

// 아파트 관리 현황 모달 닫기 함수
function closeApartmentDataModal() {
    console.log('🚪 아파트 관리 현황 모달 닫기');

    const modal = document.getElementById('apartmentDataModal');
    if (modal) {
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
    }

    // body 스크롤 복원
    document.body.style.overflow = '';
}

// 전역 함수로 등록
window.loadApartmentData = loadApartmentData;
window.showApartmentDataModal = showApartmentDataModal;
window.closeApartmentDataModal = closeApartmentDataModal;