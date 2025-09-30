import requests
from datetime import datetime
import urllib3
import ssl
from requests.adapters import HTTPAdapter
from urllib3.util.ssl_ import create_urllib3_context

# SSL 경고 메시지 비활성화
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class CustomHTTPAdapter(HTTPAdapter):
    """SSL 설정을 커스터마이징한 HTTP 어댑터"""
    def init_poolmanager(self, *args, **pool_kwargs):
        context = create_urllib3_context()
        context.set_ciphers('DEFAULT@SECLEVEL=1')
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        pool_kwargs['ssl_context'] = context
        return super().init_poolmanager(*args, **pool_kwargs)

# 세션 생성 및 어댑터 설정
session = requests.Session()
session.mount('https://', CustomHTTPAdapter())

url = 'http://apis.data.go.kr/1360000/MidFcstInfoService/getMidFcst'
params = {
    'serviceKey': 'ZIj9zzuRIMxp+EfcaVKkmIMZ/voQ/H54VWnHEsHMuH5HJaf+YHu4m257whWHx0Xqr+ihyOH0C6o+BxZFftnTog==',
    'pageNo': '1',
    'numOfRows': '10',
    'dataType': 'JSON',
    'stnId': '108',  # 서울 기상대
    'tmFc': datetime.now().strftime("%Y%m%d0600")  # 오늘 날짜 06시 발표본
}

# 헤더 설정
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

try:
    print("API 요청 시도 중...")
    # 커스텀 세션으로 SSL 검증 비활성화 및 타임아웃 설정
    response = session.get(url, params=params, headers=headers, verify=False, timeout=30)
    response.raise_for_status()  # HTTP 에러 체크
    print("요청 성공!")
    print(response.text)
except requests.exceptions.SSLError as e:
    print(f"SSL 에러 발생: {e}")
    print("다른 방법을 시도합니다...")
    
    # 백업 방법: HTTP 프로토콜 사용 (테스트용)
    try:
        http_url = url.replace('https://', 'http://')
        print(f"HTTP로 재시도: {http_url}")
        response = requests.get(http_url, params=params, headers=headers, timeout=30)
        response.raise_for_status()
        print("HTTP 요청 성공!")
        print(response.text)
    except Exception as http_e:
        print(f"HTTP 요청도 실패: {http_e}")
        
except requests.exceptions.RequestException as e:
    print(f"요청 에러 발생: {e}")
except Exception as e:
    print(f"일반 에러 발생: {e}")
finally:
    session.close()
