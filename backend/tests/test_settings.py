from alignment_memory.settings import Settings


def test_settings_read_environment_without_credentials(monkeypatch) -> None:
    monkeypatch.setenv("APP_NAME", "Alignment Memory Test")
    monkeypatch.setenv("APP_MODE", "live")

    settings = Settings(_env_file=None)

    assert settings.app_name == "Alignment Memory Test"
    assert settings.app_mode == "live"
