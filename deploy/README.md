# 공개 서버 배포

`main`에 푸시하면 GitHub Actions가 Node 24에서 테스트, lint, 빌드를 확인하고
Ubuntu 서버에 새 릴리스를 보냅니다. 서버는 Caddy로
<https://leedada.duckdns.org/>를 HTTPS로 제공하고, 게임/API는
`127.0.0.1:4173`에서 함께 실행합니다. 첫 배포 전에 아래 초기 설정이 필요합니다.

## 서버 초기 설정

대상은 `leedada.duckdns.org`가 가리키는 Ubuntu 서버입니다. 이미 실행 중인
Caddy의 다른 사이트는 유지하고 `/etc/caddy/sites/dh-game.caddy`만 추가합니다.
서버 관리자 SSH 접속에서 다음을 실행합니다.

```bash
scp deploy/server-setup.sh ubuntu@leedada.duckdns.org:~/dh-game-server-setup.sh
ssh ubuntu@leedada.duckdns.org 'sudo bash ~/dh-game-server-setup.sh ubuntu'
```

스크립트는 공식 Node 24 arm64/x64 릴리스를 SHA-256으로 확인해
`/opt/dh-game/node`에 별도 설치합니다. 앱 릴리스는 `/srv/dh-game/releases/`,
플레이 기록은 `/var/lib/dh-game/nyanyang.sqlite`에 둡니다. 설정 중 Caddy
검증이나 reload가 실패하면 이전 Caddy 설정을 복원합니다.

GitHub Actions용 **별도 Ed25519 키**의 공개키를 서버의 배포 사용자
`~/.ssh/authorized_keys`에 등록합니다. 개인키는 GitHub Actions의 `SSH_KEY`
저장소 비밀값으로만 등록합니다. 개인키를 Git에 커밋하거나 채팅에 붙이지
않습니다. `SSH_KNOWN_HOSTS`에는 실제 서버의 SSH 호스트 키를 등록하고,
서버에서 확인한 지문과 비교합니다.

| GitHub Actions 비밀값 | 값 |
|---|---|
| `SSH_HOST` | `leedada.duckdns.org` |
| `SSH_USER` | 서버의 배포 사용자 (`ubuntu`) |
| `SSH_KEY` | 배포 전용 개인키 전문 |
| `SSH_KNOWN_HOSTS` | 검증한 `leedada.duckdns.org` 호스트 키 한 줄 |

## 배포와 확인

서버와 비밀값 준비가 끝나면 `main` 푸시 또는 Actions의 `Deploy game` 수동
실행으로 배포합니다. 각 실행은 새 릴리스 디렉터리에 파일을 넣고
`npm ci --omit=dev`를 수행합니다. 서비스 전환 뒤 로컬 API 상태 확인에
실패하면 이전 릴리스로 돌아갑니다. 마지막 단계는 공개 주소의 첫 화면과
`/api/health`를 확인합니다.

배포할 때 `/var/lib/dh-game`은 삭제하거나 동기화하지 않습니다. 기존
플레이어 프로필은 유지됩니다. 복구가 필요하면
`/srv/dh-game/current` 링크를 이전 릴리스로 바꾸고
`sudo systemctl restart dh-game`을 실행합니다. DB 백업은 서버에서
`NYANG_DB_PATH=/var/lib/dh-game/nyanyang.sqlite npm run db:backup`으로
별도 보관합니다.
