import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Navigation from "../Navigation";

// Mock usePathname
const mockPathname = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

describe("Navigation", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/");
  });

  it("應該顯示網站標題", () => {
    render(<Navigation />);

    expect(screen.getByText("新和週六野球聯盟")).toBeInTheDocument();
  });

  it("應該顯示所有導航項目", () => {
    render(<Navigation />);

    // Each nav item appears twice (desktop + mobile), so use getAllByRole
    expect(screen.getAllByRole("link", { name: "首頁" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "球團" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "賽程" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "排行榜" })).toHaveLength(2);
  });

  it("應該有正確的導航連結", () => {
    render(<Navigation />);

    const homeLinks = screen.getAllByRole("link", { name: "首頁" });
    const teamsLinks = screen.getAllByRole("link", { name: "球團" });
    const scheduleLinks = screen.getAllByRole("link", { name: "賽程" });
    const standingsLinks = screen.getAllByRole("link", { name: "排行榜" });

    // Check desktop links (first one)
    expect(homeLinks[0]).toHaveAttribute("href", "/");
    expect(teamsLinks[0]).toHaveAttribute("href", "/teams");
    expect(scheduleLinks[0]).toHaveAttribute("href", "/#schedule");
    expect(standingsLinks[0]).toHaveAttribute("href", "/#standings");
  });

  it("當前頁面應該高亮顯示", () => {
    mockPathname.mockReturnValue("/teams");
    render(<Navigation />);

    const teamsLinks = screen.getAllByRole("link", { name: "球團" });
    // Both desktop and mobile links should be highlighted
    expect(teamsLinks[0]).toHaveClass("text-primary-600");
    expect(teamsLinks[0]).toHaveClass("font-semibold");
  });

  it("首頁連結在首頁時應該高亮", () => {
    mockPathname.mockReturnValue("/");
    render(<Navigation />);

    const homeLinks = screen.getAllByRole("link", { name: "首頁" });
    expect(homeLinks[0]).toHaveClass("text-primary-600");
  });

  it("應該有漢堡選單按鈕（手機版）", () => {
    render(<Navigation />);

    const menuButton = screen.getByRole("button", {
      name: /開啟選單|關閉選單/i,
    });
    expect(menuButton).toBeInTheDocument();
  });

  it("點擊漢堡選單應該展開/收起手機選單", async () => {
    const user = userEvent.setup();
    render(<Navigation />);

    const menuButton = screen.getByRole("button", { name: /開啟選單/i });

    // 初始狀態：選單收起
    const mobileMenu = screen.getByTestId("mobile-menu");
    expect(mobileMenu).toHaveClass("max-h-0");

    // 點擊展開
    await user.click(menuButton);
    expect(mobileMenu).toHaveClass("max-h-64");

    // 再次點擊收起
    await user.click(screen.getByRole("button", { name: /關閉選單/i }));
    expect(mobileMenu).toHaveClass("max-h-0");
  });

  it("手機選單中點擊連結應該關閉選單", async () => {
    const user = userEvent.setup();
    render(<Navigation />);

    // 展開選單
    const menuButton = screen.getByRole("button", { name: /開啟選單/i });
    await user.click(menuButton);

    // 點擊選單中的連結
    const mobileLinks = screen.getAllByRole("link", { name: "球團" });
    const mobileLink = mobileLinks.find((link) =>
      link.closest('[data-testid="mobile-menu"]')
    );

    if (mobileLink) {
      await user.click(mobileLink);
    }

    // 選單應該關閉
    const mobileMenu = screen.getByTestId("mobile-menu");
    expect(mobileMenu).toHaveClass("max-h-0");
  });

  it("應該有正確的 aria 屬性", () => {
    render(<Navigation />);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveAttribute("aria-label", "主要導航");

    const menuButton = screen.getByRole("button", {
      name: /開啟選單|關閉選單/i,
    });
    expect(menuButton).toHaveAttribute("aria-expanded");
  });

  it("應該可以自訂網站標題", () => {
    render(<Navigation siteTitle="自訂標題" />);

    expect(screen.getByText("自訂標題")).toBeInTheDocument();
  });

  it("應該可以自訂導航項目", () => {
    const customItems = [
      { label: "自訂一", href: "/custom1" },
      { label: "自訂二", href: "/custom2" },
    ];

    render(<Navigation items={customItems} />);

    // Each custom item appears twice (desktop + mobile)
    expect(screen.getAllByRole("link", { name: "自訂一" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "自訂二" })).toHaveLength(2);
  });

  it("應該固定在頂部", () => {
    render(<Navigation />);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("sticky");
    expect(nav).toHaveClass("top-0");
  });
});
