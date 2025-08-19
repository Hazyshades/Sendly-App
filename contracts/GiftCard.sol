// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GiftCard is ERC721Enumerable, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    IERC20 public usdcToken;
    IERC20 public usdtToken;

    struct GiftCardInfo {
        uint256 amount;
        address token;
        bool redeemed;
        string message;
    }

    mapping(uint256 => GiftCardInfo) public giftCards;

    event GiftCardCreated(
        uint256 tokenId,
        address recipient,
        uint256 amount,
        address token,
        string uri,
        string message
    );
    event GiftCardRedeemed(
        uint256 tokenId,
        address redeemer,
        uint256 amount,
        address token
    );

    constructor(address _usdcAddress, address _usdtAddress)
        ERC721("GiftCard", "GIFT")
        Ownable()
    {
        usdcToken = IERC20(_usdcAddress);
        usdtToken = IERC20(_usdtAddress);
    }

    function createGiftCard(
        address _recipient,
        uint256 _amount,
        address _token,
        string memory _metadataURI,
        string memory _message
    ) public returns (uint256) {
        require(
            _token == address(usdcToken) || _token == address(usdtToken),
            "Invalid token"
        );

        require(
            IERC20(_token).transferFrom(msg.sender, address(this), _amount),
            "Token transfer to contract failed"
        );

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        _safeMint(_recipient, tokenId);
        _setTokenURI(tokenId, _metadataURI);

        giftCards[tokenId] = GiftCardInfo({
            amount: _amount,
            token: _token,
            redeemed: false,
            message: _message
        });

        emit GiftCardCreated(
            tokenId,
            _recipient,
            _amount,
            _token,
            _metadataURI,
            _message
        );
        return tokenId;
    }

    function redeemGiftCard(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner of the gift card");
        require(!giftCards[tokenId].redeemed, "Gift card already redeemed");

        GiftCardInfo storage card = giftCards[tokenId];
        card.redeemed = true;

        IERC20 selectedToken = IERC20(card.token);
        require(
            selectedToken.transfer(msg.sender, card.amount),
            "Token transfer failed"
        );

        emit GiftCardRedeemed(tokenId, msg.sender, card.amount, card.token);
    }

    function getGiftCardInfo(uint256 tokenId)
        public
        view
        returns (GiftCardInfo memory)
    {
        return giftCards[tokenId];
    }

    // --- SOLIDITY OVERRIDES FOR MULTIPLE INHERITANCE ---

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
